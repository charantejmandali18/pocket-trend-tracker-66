import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  FileText, 
  Users, 
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  addStoredTransaction, 
  findOrCreateStoredCategory, 
  addStoredAccount,
  getStoredCategories,
  addUserMapping,
  getUserIdByEmail
} from '@/utils/dataStorage';

interface ImportResult {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: string[];
  createdCategories: string[];
}

const ImportData = () => {
  const { user, isPersonalMode, currentGroup, categories, addCategory, refreshData } = useApp();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);

  const downloadTemplate = (type: 'individual' | 'group') => {
    const filename = type === 'individual' 
      ? 'individual-expense-template.csv' 
      : 'group-expense-template.csv';
    
    const link = document.createElement('a');
    link.href = `/templates/${filename}`;
    link.download = filename;
    link.click();
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return rows;
  };

  const findOrCreateCategory = async (categoryName: string, createdCategories: Set<string>): Promise<string | null> => {
    // Use localStorage storage system for categories
    try {
      const existingCategory = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      
      if (!existingCategory) {
        // This will be a new category
        createdCategories.add(categoryName);
      }
      
      const category = findOrCreateStoredCategory(categoryName);
      return category.id;
    } catch (error) {
      console.error('Error finding/creating category:', error);
      return null;
    }
  };

  const importIndividualData = async (rows: any[]): Promise<ImportResult> => {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];
    const createdCategories = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        setProgress((i / rows.length) * 100);

        // Validate required fields
        if (!row['Transaction Type'] || !row['Date'] || !row['Description'] || !row['Amount']) {
          errors.push(`Row ${i + 2}: Missing required fields`);
          failed++;
          continue;
        }

        // Find or create category
        const categoryId = await findOrCreateCategory(row['Category'] || 'Other', createdCategories);
        if (!categoryId) {
          errors.push(`Row ${i + 2}: Failed to create category`);
          failed++;
          continue;
        }

        // Store transaction in localStorage
        try {
          const category = findOrCreateStoredCategory(row['Category'] || 'Other');
          
          const storedTransaction = addStoredTransaction({
            user_id: user.id,
            group_id: isPersonalMode ? null : currentGroup?.id || null,
            created_by: user.id,
            transaction_type: row['Transaction Type'].toLowerCase() as 'income' | 'expense',
            amount: parseFloat(row['Amount']) || 0,
            description: row['Description'],
            category_id: categoryId,
            transaction_date: row['Date'],
            payment_method: (row['Payment Method'] || 'cash').toLowerCase(),
            account_name: row['Account'] || '',
            notes: row['Notes'] || '',
            source: 'csv_import',
            categories: {
              id: category.id,
              name: category.name,
              color: category.color,
              icon: category.icon
            }
          });
          
          // Validate the transaction
          if (storedTransaction.amount > 0) {
            successful++;
          } else {
            errors.push(`Row ${i + 2}: Invalid amount`);
            failed++;
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Storage error'}`);
          failed++;
        }
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    return {
      totalRows: rows.length,
      successfulRows: successful,
      failedRows: failed,
      errors,
      createdCategories: Array.from(createdCategories)
    };
  };

  const importGroupData = async (rows: any[]): Promise<ImportResult> => {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];
    const createdCategories = new Set<string>();

    // Group rows by member email
    const memberTransactions: { [email: string]: any[] } = {};
    
    for (const row of rows) {
      const email = row['Member Email'];
      if (!memberTransactions[email]) {
        memberTransactions[email] = [];
      }
      memberTransactions[email].push(row);
    }

    let processedRows = 0;

    for (const [memberEmail, transactions] of Object.entries(memberTransactions)) {
      for (const row of transactions) {
        try {
          setProgress((processedRows / rows.length) * 100);
          processedRows++;

          // Validate required fields
          if (!row['Transaction Type'] || !row['Date'] || !row['Description'] || !row['Amount']) {
            errors.push(`Row for ${memberEmail}: Missing required fields`);
            failed++;
            continue;
          }

          // Find or create category
          const categoryId = await findOrCreateCategory(row['Category'] || 'Other', createdCategories);
          if (!categoryId) {
            errors.push(`Row for ${memberEmail}: Failed to create category`);
            failed++;
            continue;
          }

          // Store transaction and account in localStorage
          try {
            const category = findOrCreateStoredCategory(row['Category'] || 'Other');
            
            // Create/store account for member email
            addStoredAccount({
              name: memberEmail.split('@')[0], // Use email prefix as name
              email: memberEmail,
              type: 'external'
            });
            
            // Try to find existing user ID for this email, otherwise create a mapping
            let transactionUserId = getUserIdByEmail(memberEmail);
            if (!transactionUserId) {
              // Create a unique user ID for this email
              transactionUserId = `user_${memberEmail.replace('@', '_').replace('.', '_')}_${Date.now()}`;
              addUserMapping({
                email: memberEmail,
                user_id: transactionUserId,
                name: memberEmail.split('@')[0]
              });
            }
            
            const storedTransaction = addStoredTransaction({
              user_id: transactionUserId, // The actual transaction owner
              group_id: currentGroup?.id || null,
              created_by: user.id, // The importer
              transaction_type: row['Transaction Type'].toLowerCase() as 'income' | 'expense',
              amount: parseFloat(row['Amount']) || 0,
              description: `${row['Description']} (by ${memberEmail})`,
              category_id: categoryId,
              transaction_date: row['Date'],
              payment_method: (row['Payment Method'] || 'cash').toLowerCase(),
              account_name: row['Account'] || '',
              notes: row['Notes'] || '',
              source: 'csv_import',
              member_email: memberEmail,
              categories: {
                id: category.id,
                name: category.name,
                color: category.color,
                icon: category.icon
              }
            });
            
            // Validate the transaction
            if (storedTransaction.amount > 0) {
              successful++;
            } else {
              errors.push(`Row for ${memberEmail}: Invalid amount`);
              failed++;
            }
          } catch (error) {
            errors.push(`Row for ${memberEmail}: ${error instanceof Error ? error.message : 'Storage error'}`);
            failed++;
          }
        } catch (error) {
          errors.push(`Row for ${memberEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          failed++;
        }
      }
    }

    return {
      totalRows: rows.length,
      successfulRows: successful,
      failedRows: failed,
      errors,
      createdCategories: Array.from(createdCategories)
    };
  };

  const handleImport = async () => {
    if (!file || !user) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('No valid data found in the CSV file');
      }

      // Mock import logging for now since new schema might not be applied yet
      // In production, this would log to the import_logs table
      const mockImportLog = {
        id: `mock-${Date.now()}`,
        user_id: user.id,
        group_id: isPersonalMode ? null : currentGroup?.id || null,
        import_type: isPersonalMode ? 'individual' : 'group',
        file_name: file.name,
        total_rows: rows.length,
        status: 'processing'
      };

      // Determine import type based on CSV headers and validate against current mode
      const hasGroupColumns = rows[0]?.hasOwnProperty('Member Email');
      
      // Validate template matches current mode
      if (isPersonalMode && hasGroupColumns) {
        throw new Error('You are in Personal mode but uploaded a Group template. Please switch to Group mode or download the Individual template.');
      }
      
      if (!isPersonalMode && !hasGroupColumns) {
        throw new Error('You are in Group mode but uploaded an Individual template. Please switch to Personal mode or download the Group template.');
      }
      
      const result = hasGroupColumns 
        ? await importGroupData(rows)
        : await importIndividualData(rows);

      // Mock import log update for now since new schema might not be applied yet
      // In production, this would update the import_logs table
      if (mockImportLog) {
        console.log('Mock import log updated:', {
          id: mockImportLog.id,
          successful_rows: result.successfulRows,
          failed_rows: result.failedRows,
          errors: result.errors,
          status: result.failedRows === 0 ? 'completed' : 'completed'
        });
      }

      setImportResult(result);
      setProgress(100);

      // Trigger data refresh to update all components
      refreshData();

      const message = result.createdCategories.length > 0 
        ? `${result.successfulRows} transactions imported successfully. Created ${result.createdCategories.length} new categories.`
        : `${result.successfulRows} transactions imported successfully`;

      toast({
        title: "Import Completed",
        description: message,
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Import Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Import your existing expense data from CSV files
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates Section */}
        <Card>
          <CardHeader>
            <CardTitle>Download Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {isPersonalMode ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Individual Template</div>
                      <div className="text-sm text-gray-500">
                        For personal expense tracking
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadTemplate('individual')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Group Template</div>
                      <div className="text-sm text-gray-500">
                        For family/shared expenses with member emails
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadTemplate('group')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                {isPersonalMode 
                  ? "Download the individual template for personal expense tracking. Fill it with your data and upload it below."
                  : "Download the group template for shared expenses. Make sure to include member emails for proper attribution."
                }
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="file">Select CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={importing}
                />
              </div>

              {file && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}

              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing data...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              <Button 
                onClick={handleImport} 
                disabled={!file || importing}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importing...' : 'Import Data'}
              </Button>
            </div>

            {importResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {importResult.totalRows}
                    </div>
                    <div className="text-xs text-blue-600">Total Rows</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.successfulRows}
                    </div>
                    <div className="text-xs text-green-600">Successful</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {importResult.failedRows}
                    </div>
                    <div className="text-xs text-red-600">Failed</div>
                  </div>
                </div>

                {importResult.createdCategories.length > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">New Categories Created:</div>
                      <div className="flex flex-wrap gap-1">
                        {importResult.createdCategories.map((category, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                            {category}
                          </span>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {importResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">Import Errors:</div>
                      <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                        {importResult.errors.length > 5 && (
                          <div>... and {importResult.errors.length - 5} more errors</div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Individual Import</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Download the individual template</li>
                <li>• Fill in your transaction data</li>
                <li>• Use format: expense/income for Transaction Type</li>
                <li>• Date format: YYYY-MM-DD</li>
                <li>• Categories will be auto-created if they don't exist</li>
                <li>• Upload the completed CSV file</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Group Import</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Download the group template</li>
                <li>• Include email addresses for each member</li>
                <li>• Use "Split With Emails" for shared expenses</li>
                <li>• Individual data will be updated based on emails</li>
                <li>• All transactions will appear in the group</li>
                <li>• Upload when in group mode</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportData;