-- ENUMS
CREATE TYPE user_role AS ENUM ('OWNER', 'KASIR');
CREATE TYPE shift_status AS ENUM ('AMAN', 'MINUS', 'LEBIH');
CREATE TYPE deposit_status AS ENUM ('BELUM_SETOR', 'SUDAH_SETOR');

-- TABLE: users (mextends auth.users bawaan Supabase)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role DEFAULT 'KASIR'
);

-- TABLE: products
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  min_stock INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: shifts
CREATE TABLE public.shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  initial_cash DECIMAL(10,2) NOT NULL,
  expected_cash DECIMAL(10,2),
  actual_cash DECIMAL(10,2),
  difference DECIMAL(10,2),
  status shift_status,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: transactions
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  shift_id UUID REFERENCES public.shifts(id) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'CASH',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: transaction_items
CREATE TABLE public.transaction_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  qty INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: deposits
CREATE TABLE public.deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID REFERENCES public.shifts(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status deposit_status DEFAULT 'BELUM_SETOR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGER update timestamp products
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ENABLE RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Users
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);

-- Products
CREATE POLICY "All users can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Only owners can insert products" ON public.products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'OWNER'));
CREATE POLICY "Only owners can update products" ON public.products FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'OWNER'));

-- Shifts
CREATE POLICY "Kasir can view their own shifts" ON public.shifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kasir can create their own shifts" ON public.shifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kasir can update their own shifts" ON public.shifts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner can view all shifts" ON public.shifts FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'OWNER'));

-- Transactions
CREATE POLICY "Kasir can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kasir can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner can view all transactions" ON public.transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'OWNER'));

-- Transaction Items
CREATE POLICY "All users can view transaction items" ON public.transaction_items FOR SELECT USING (true);
CREATE POLICY "Users can insert transaction items" ON public.transaction_items FOR INSERT WITH CHECK (true);

-- Deposits
CREATE POLICY "Kasir can manage own shift deposits" ON public.deposits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.shifts WHERE id = public.deposits.shift_id AND user_id = auth.uid())
);
CREATE POLICY "Owner can view all deposits" ON public.deposits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'OWNER')
);

-- SEED DATA
INSERT INTO public.products (name, category, stock, price, min_stock) VALUES 
('Semen Gersik 50KG', 'Material', 100, 65000, 20),
('Paku 5cm', 'Material', 200, 15000, 50),
('Cat Avian 1KG Putih', 'Cat', 30, 45000, 10),
('Pipa PVC 1 inch', 'Pipa', 50, 25000, 10),
('Kabel Eterna 2x1.5', 'Listrik', 10, 85000, 3);

-- TABLE: suppliers
CREATE TABLE public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: supplier_products
CREATE TABLE public.supplier_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  cost_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_id, product_id)
);

-- TABLE: stock_purchases
CREATE TABLE public.stock_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  qty INT NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_purchases ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Owner manage suppliers" ON public.suppliers FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'OWNER'));
CREATE POLICY "Owner manage supplier_products" ON public.supplier_products FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'OWNER'));
CREATE POLICY "Owner manage stock_purchases" ON public.stock_purchases FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'OWNER'));

-- TRIGGER Update Stock automatically when stock_purchases is inserted
CREATE OR REPLACE FUNCTION update_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
   UPDATE public.products
   SET stock = stock + NEW.qty
   WHERE id = NEW.product_id;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_purchase
AFTER INSERT ON public.stock_purchases
FOR EACH ROW EXECUTE FUNCTION update_stock_after_purchase();
