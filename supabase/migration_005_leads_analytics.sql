-- ============================================================
-- MIGRASI: View Analisis untuk Leads (Sales Pipeline)
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Membuat 2 VIEW (bukan tabel baru) — aman dijalankan kapan saja, tidak mengubah data.
-- Setelah ini, kamu bisa buka Supabase > Table Editor > cari "v_leads_funnel" atau
-- "v_leads_potential_value" untuk lihat/filter/export datanya langsung dari database,
-- tanpa perlu buka aplikasi.
-- ============================================================

-- Ringkasan jumlah leads per status & rating — untuk lihat funnel secara sekilas.
create or replace view v_leads_funnel as
select
  status,
  deal_rating,
  count(*) as jumlah_leads
from leads
group by status, deal_rating
order by status, deal_rating;

-- Estimasi nilai potensial per leads (dikonversi ke perkiraan nilai per bulan),
-- berguna untuk memprioritaskan follow-up berdasarkan besar potensi, bukan cuma rating.
create or replace view v_leads_potential_value as
select
  l.id as lead_id,
  c.name as customer_name,
  l.status,
  l.deal_rating,
  l.next_follow_up_date,
  coalesce(sum(
    li.usual_price * li.qty_per_frequency * case li.frequency
      when 'Harian' then 30
      when 'Mingguan' then 4.33
      else 1
    end
  ), 0) as estimasi_nilai_bulanan
from leads l
left join customers c on c.id = l.customer_id
left join lead_items li on li.lead_id = l.id
group by l.id, c.name, l.status, l.deal_rating, l.next_follow_up_date
order by estimasi_nilai_bulanan desc;
