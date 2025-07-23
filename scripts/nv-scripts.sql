-- Ajoute les champs pour la gestion des tarifs et du paiement sur chaque ticket
ALTER TABLE tickets
ADD COLUMN proposed_price numeric(10,2),
ADD COLUMN price_status text CHECK (price_status IN ('none', 'proposed', 'accepted', 'refused', 'paid')) DEFAULT 'none',
ADD COLUMN payment_date timestamp;

-- Table pour tracer tous les paiements liés aux tickets
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id),
  technician_id uuid REFERENCES profiles(id),
  amount numeric(10,2) NOT NULL,
  status text CHECK (status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  created_at timestamp DEFAULT now(),
  paid_at timestamp
);
-- ajout des index pour la performance
CREATE INDEX idx_transactions_ticket_id ON transactions(ticket_id);
CREATE INDEX idx_transactions_client_id ON transactions(client_id);
CREATE INDEX idx_transactions_technician_id ON transactions(technician_id);

CREATE TABLE materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  location text,
  status text CHECK (status IN ('Fonctionnel', 'En panne', 'Maintenance')) DEFAULT 'Fonctionnel',
  assigned_to uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Historique des interventions sur chaque matériel
CREATE TABLE material_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES tickets(id),
  action text, -- e.g. 'Affecté', 'Réparé', 'Mis en maintenance'
  performed_by uuid REFERENCES profiles(id),
  performed_at timestamp with time zone DEFAULT now(),
  details text
);

CREATE INDEX idx_materials_assigned_to ON materials(assigned_to);
CREATE INDEX idx_material_history_material_id ON material_history(material_id);

-- Table pour les événements de planning
CREATE TABLE planning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  type text,
  created_by uuid REFERENCES profiles(id),
  assigned_to uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now()
);
-- index pour la performance
CREATE INDEX idx_planning_events_date ON planning_events(date);
CREATE INDEX idx_planning_events_assigned_to ON planning_events(assigned_to);