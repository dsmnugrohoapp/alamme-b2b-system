-- Keterangan Invoice (opsional, tampil di Invoice/Quotation untuk customer)
-- BERBEDA dari kolom "notes" yang merupakan catatan internal untuk PIC fulfillment.
alter table orders add column if not exists invoice_notes text;
