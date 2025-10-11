import React, { useEffect, useState } from 'react'

function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/items', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => { setItems(d); setLoading(false) })
      .catch(e => { console.error(e); setLoading(false) })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ maxWidth: 900, margin: '20px auto', fontFamily: 'Arial' }}>
      <h1>Items (SPA)</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th>SKU</th><th>Name</th><th>Primary</th><th>Category</th><th>Updated By</th></tr></thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td>{it.sku}</td>
              <td>{it.name}</td>
              <td>{it.primary_detail}</td>
              <td>{it.category_name || ''}</td>
              <td>{it.updated_by_email || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
