import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Upload,
  Lock,
  CheckCircle,
  AlertTriangle,
  Info,
  CreditCard,
  Building,
  DollarSign,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { creditReportParser, type CreditReportParseResult, type CreditReportAccount } from '@/services/creditReportParser';

interface CreditReportUploadProps {
  onAccountsExtracted: (accounts: CreditReportAccount[]) => void;
  isUploading?: boolean;
}

const CreditReportUpload: React.FC<CreditReportUploadProps> = ({
  onAccountsExtracted,
  isUploading = false
}) => {
  const { toast } = useToast();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseResult, setParseResult] = useState<CreditReportParseResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setParseResult(null);
    setNeedsPassword(false);
    setPassword('');

    // Check if PDF needs password
    try {
      const isProtected = await creditReportParser.isPDFPasswordProtected(file);
      setNeedsPassword(isProtected);
      
      if (isProtected) {
        toast({
          title: "Password Protected",
          description: "This PDF requires a password to open",
        });
      }
    } catch (error) {
      console.error('Error checking PDF password protection:', error);
      
      let errorMessage = "Failed to read PDF file";
      if (error instanceof Error) {
        if (error.message.includes('Setting up fake worker failed') || 
            error.message.includes('Failed to fetch dynamically imported module')) {
          errorMessage = "PDF processing is temporarily unavailable. Please try again in a moment.";
        } else if (error.message.includes('Failed to check PDF')) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return;
    }

    if (needsPassword && !password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter the password for this PDF",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Parse the credit report
      const result = await creditReportParser.parseCreditReport(
        selectedFile,
        needsPassword ? password : undefined
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      setParseResult(result);

      if (result.activeAccounts > 0) {
        toast({
          title: "Credit Report Processed",
          description: `Found ${result.activeAccounts} active accounts`,
        });
      } else {
        toast({
          title: "No Active Accounts Found",
          description: "The credit report was processed but no active accounts were detected",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error processing credit report:', error);
      
      let errorMessage = "Failed to process credit report";
      if (error instanceof Error) {
        if (error.message.includes('Setting up fake worker failed') || 
            error.message.includes('Failed to fetch dynamically imported module')) {
          errorMessage = "PDF processing is temporarily unavailable. Please check your internet connection and try again.";
        } else if (error.message.includes('Incorrect password')) {
          errorMessage = "Incorrect password provided for the PDF file.";
        } else if (error.message.includes('Failed to parse credit report')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddAccounts = () => {
    if (parseResult && parseResult.accounts.length > 0) {
      onAccountsExtracted(parseResult.accounts);
      
      toast({
        title: "Accounts Added",
        description: `${parseResult.activeAccounts} accounts added to unprocessed queue`,
      });

      // Reset form
      setSelectedFile(null);
      setPassword('');
      setParseResult(null);
      setShowPreview(false);
      setNeedsPassword(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPassword('');
    setParseResult(null);
    setShowPreview(false);
    setNeedsPassword(false);
    setUploadProgress(0);
  };

  const getAccountTypeIcon = (accountType: CreditReportAccount['accountType']) => {
    switch (accountType) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'loan':
        return <Building className="h-4 w-4" />;
      case 'savings':
      case 'current':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getAccountTypeColor = (accountType: CreditReportAccount['accountType']) => {
    switch (accountType) {
      case 'credit_card':
        return 'bg-purple-100 text-purple-800';
      case 'loan':
        return 'bg-orange-100 text-orange-800';
      case 'savings':
        return 'bg-green-100 text-green-800';
      case 'current':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Import Credit Report
        </CardTitle>
        <p className="text-sm text-gray-500">
          Upload your credit report PDF to automatically discover and add your active accounts
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            We support credit reports from CIBIL, Experian, Equifax, and CRIF. Only active accounts will be added to your portfolio.
          </AlertDescription>
        </Alert>

        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              
              <div>
                <Label htmlFor="credit-report" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-900">
                    {selectedFile ? selectedFile.name : 'Choose credit report PDF'}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload PDF files up to 10MB
                  </p>
                </Label>
                <Input
                  id="credit-report"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {selectedFile && (
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Password Input (if needed) */}
          {needsPassword && (
            <div className="space-y-2">
              <Label htmlFor="pdf-password" className="flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                PDF Password
              </Label>
              <div className="relative">
                <Input
                  id="pdf-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter PDF password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Processing credit report...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isProcessing || isUploading}
              className="flex-1"
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Process Report
                </>
              )}
            </Button>

            {selectedFile && (
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={isProcessing}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Parse Results */}
        {parseResult && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Processing Results</h3>
              {parseResult.accounts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Hide' : 'Preview'} Accounts
                </Button>
              )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{parseResult.totalAccounts}</div>
                <div className="text-xs text-blue-600">Total Found</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">{parseResult.activeAccounts}</div>
                <div className="text-xs text-green-600">Active Accounts</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">{parseResult.reportType || 'Unknown'}</div>
                <div className="text-xs text-purple-600">Report Type</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-600">
                  {parseResult.reportDate ? new Date(parseResult.reportDate).getFullYear() : 'N/A'}
                </div>
                <div className="text-xs text-gray-600">Report Year</div>
              </div>
            </div>

            {/* Account Preview */}
            {showPreview && parseResult.accounts.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {parseResult.accounts.map((account, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getAccountTypeIcon(account.accountType)}
                        <span className="font-medium">{account.bankName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getAccountTypeColor(account.accountType)}>
                          {account.accountType.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(account.confidenceScore * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="text-gray-500">Account:</span> ****{account.accountNumber.slice(-4)}
                      </div>
                      {account.balance && (
                        <div>
                          <span className="text-gray-500">Balance:</span> ₹{account.balance.toLocaleString()}
                        </div>
                      )}
                      {account.creditLimit && (
                        <div>
                          <span className="text-gray-500">Limit:</span> ₹{account.creditLimit.toLocaleString()}
                        </div>
                      )}
                      {account.openDate && (
                        <div>
                          <span className="text-gray-500">Opened:</span> {account.openDate}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Processing Warnings:</p>
                    {parseResult.errors.map((error, index) => (
                      <p key={index} className="text-sm">{error}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Add Accounts Button */}
            {parseResult.activeAccounts > 0 && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleAddAccounts}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add {parseResult.activeAccounts} Accounts to Review Queue
                </Button>
              </div>
            )}

            {/* No accounts found */}
            {parseResult.activeAccounts === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No active accounts were found in this credit report. This could mean:
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    <li>All accounts in the report are closed or inactive</li>
                    <li>The PDF format is not recognized by our parser</li>
                    <li>The report contains only credit inquiries or other non-account data</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Information Section */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Supported Information:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>• Credit cards and limits</div>
            <div>• Personal and home loans</div>
            <div>• Bank account details</div>
            <div>• Account opening dates</div>
            <div>• Current balances</div>
            <div>• Account status</div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            <p>
              <strong>Privacy:</strong> Credit reports are processed locally in your browser. 
              No sensitive financial data is sent to our servers.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditReportUpload;