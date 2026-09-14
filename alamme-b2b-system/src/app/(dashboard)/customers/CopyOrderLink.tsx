'use client';

export default function CopyOrderLink({ token }: { token: string }) {
  function copy() {
    const url = `${window.location.origin}/order/${token}`;
    navigator.clipboard.writeText(url).then(
      () => alert('Link Order Mandiri disalin:\n' + url),
      () => alert('Gagal menyalin. Ini link-nya:\n' + url)
    );
  }
  return (
    <button onClick={copy} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>
      Salin Link Order
    </button>
  );
}
