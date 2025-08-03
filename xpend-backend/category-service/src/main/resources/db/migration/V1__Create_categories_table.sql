-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    group_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    category_type VARCHAR(20) NOT NULL CHECK (category_type IN ('income', 'expense')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system_default BOOLEAN NOT NULL DEFAULT false,
    parent_category_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NOT NULL,
    updated_by BIGINT
);

-- Create indexes
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_group_id ON categories(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_categories_type ON categories(category_type);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX idx_categories_parent ON categories(parent_category_id) WHERE parent_category_id IS NOT NULL;

-- Create unique constraint for category names per user
CREATE UNIQUE INDEX idx_categories_user_name ON categories(user_id, LOWER(name)) WHERE group_id IS NULL AND is_active = true;
CREATE UNIQUE INDEX idx_categories_group_name ON categories(group_id, LOWER(name)) WHERE group_id IS NOT NULL AND is_active = true;

-- Create update trigger
CREATE OR REPLACE FUNCTION update_categories_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- Insert default categories
INSERT INTO categories (name, description, color, icon, category_type, is_system_default, created_by, user_id) VALUES
-- Expense categories
('Food & Dining', 'Restaurants, groceries, and food expenses', '#EF4444', '🍽️', 'expense', true, 0, 0),
('Transportation', 'Car, gas, public transport, and travel', '#F59E0B', '🚗', 'expense', true, 0, 0),
('Shopping', 'Clothing, electronics, and general shopping', '#10B981', '🛍️', 'expense', true, 0, 0),
('Entertainment', 'Movies, games, and entertainment expenses', '#3B82F6', '🎬', 'expense', true, 0, 0),
('Bills & Utilities', 'Electricity, water, internet, and utility bills', '#8B5CF6', '⚡', 'expense', true, 0, 0),
('Healthcare', 'Medical expenses, pharmacy, and health insurance', '#EC4899', '🏥', 'expense', true, 0, 0),
('Education', 'Books, courses, and educational expenses', '#059669', '📚', 'expense', true, 0, 0),
('Home & Garden', 'Home maintenance, furniture, and garden supplies', '#7C3AED', '🏠', 'expense', true, 0, 0),
('Personal Care', 'Grooming, beauty, and personal care products', '#6B7280', '💅', 'expense', true, 0, 0),
('Miscellaneous', 'Other expenses not covered by other categories', '#DC2626', '📦', 'expense', true, 0, 0),
-- Income categories
('Salary', 'Regular salary and wages', '#10B981', '💰', 'income', true, 0, 0),
('Freelance', 'Freelance work and consulting income', '#3B82F6', '💻', 'income', true, 0, 0),
('Investment', 'Dividends, interest, and investment returns', '#8B5CF6', '📈', 'income', true, 0, 0),
('Business', 'Business income and profits', '#F59E0B', '🏢', 'income', true, 0, 0),
('Other Income', 'Other sources of income', '#6B7280', '💸', 'income', true, 0, 0);