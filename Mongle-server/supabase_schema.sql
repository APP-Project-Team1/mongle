-- Supabase Schema for Mongle Wedding Planning App
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Couples table
CREATE TABLE IF NOT EXISTS couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    wedding_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timelines table
CREATE TABLE IF NOT EXISTS timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    total_budget NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget items table
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    spent NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT,
    rating NUMERIC(2,1) DEFAULT 0,
    contact_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_couples_user1_id ON couples(user1_id);
CREATE INDEX IF NOT EXISTS idx_couples_user2_id ON couples(user2_id);
CREATE INDEX IF NOT EXISTS idx_projects_couple_id ON projects(couple_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_timelines_project_id ON timelines(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_chats_project_id ON chats(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);

-- Enable Row Level Security (RLS)
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view their couples" ON couples
    FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can insert couples" ON couples
    FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can update their couples" ON couples
    FOR UPDATE USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can delete their couples" ON couples
    FOR DELETE USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can view projects for their couples or owned projects" ON projects
    FOR SELECT USING (
        couple_id IS NULL AND owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM couples
            WHERE couples.id = projects.couple_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert projects for their couples or as owner" ON projects
    FOR INSERT WITH CHECK (
        couple_id IS NULL AND owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM couples
            WHERE couples.id = projects.couple_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update projects for their couples or owned projects" ON projects
    FOR UPDATE USING (
        couple_id IS NULL AND owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM couples
            WHERE couples.id = projects.couple_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete projects for their couples or owned projects" ON projects
    FOR DELETE USING (
        couple_id IS NULL AND owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM couples
            WHERE couples.id = projects.couple_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

-- Similar policies for other tables (scoped by couple ownership)
CREATE POLICY "Users can view timelines for their projects" ON timelines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = timelines.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert timelines for their projects" ON timelines
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = timelines.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update timelines for their projects" ON timelines
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = timelines.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete timelines for their projects" ON timelines
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = timelines.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

-- Similar policies for budgets, budget_items, chats, messages
-- (Following the same pattern as timelines)

CREATE POLICY "Users can view budgets for their projects" ON budgets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = budgets.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert budgets for their projects" ON budgets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = budgets.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update budgets for their projects" ON budgets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = budgets.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete budgets for their projects" ON budgets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = budgets.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can view budget items for their projects" ON budget_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM budgets
            JOIN projects ON budgets.project_id = projects.id
            JOIN couples ON projects.couple_id = couples.id
            WHERE budget_items.budget_id = budgets.id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert budget items for their projects" ON budget_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM budgets
            JOIN projects ON budgets.project_id = projects.id
            JOIN couples ON projects.couple_id = couples.id
            WHERE budget_items.budget_id = budgets.id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update budget items for their projects" ON budget_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM budgets
            JOIN projects ON budgets.project_id = projects.id
            JOIN couples ON projects.couple_id = couples.id
            WHERE budget_items.budget_id = budgets.id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete budget items for their projects" ON budget_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM budgets
            JOIN projects ON budgets.project_id = projects.id
            JOIN couples ON projects.couple_id = couples.id
            WHERE budget_items.budget_id = budgets.id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can view chats for their projects" ON chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = chats.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert chats for their projects" ON chats
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = chats.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update chats for their projects" ON chats
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = chats.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete chats for their projects" ON chats
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN couples ON projects.couple_id = couples.id
            WHERE projects.id = chats.project_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can view messages for their projects" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats
            JOIN projects ON chats.project_id = projects.id
            JOIN couples ON projects.couple_id = couples.id
            WHERE messages.chat_id = chats.id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages for their projects" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chats
            JOIN projects ON chats.project_id = projects.id
            JOIN couples ON projects.couple_id = couples.id
            WHERE messages.chat_id = chats.id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update messages for their projects" ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM chats
            JOIN projects ON chats.project_id = projects.id
            JOIN couples ON projects.couple_id = couples.id
            WHERE messages.chat_id = chats.id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete messages for their projects" ON messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chats
            JOIN projects ON chats.project_id = projects.id
            JOIN couples ON projects.couple_id = couples.id
            WHERE messages.chat_id = chats.id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    );

-- Vendors are public (no RLS restrictions for viewing)
CREATE POLICY "Anyone can view vendors" ON vendors
    FOR SELECT USING (true);

-- Only authenticated users can insert/update vendors (for admin purposes)
CREATE POLICY "Authenticated users can insert vendors" ON vendors
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vendors" ON vendors
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vendors" ON vendors
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();