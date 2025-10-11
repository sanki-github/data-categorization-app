document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('itemForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    const sku = form.querySelector('[name=sku]').value.trim();
    const name = form.querySelector('[name=name]').value.trim();
    if (!sku || !name) {
      e.preventDefault();
      alert('SKU and Name are required');
    }
  });
});

// bulk modal on items page
document.addEventListener('DOMContentLoaded', () => {
  const bulkBtn = document.getElementById('bulkBtn');
  const bulkModal = document.getElementById('bulkModal');
  const bulkCancel = document.getElementById('bulkCancel');
  if (bulkBtn && bulkModal) {
    bulkBtn.addEventListener('click', () => bulkModal.style.display = 'block');
  }
  if (bulkCancel && bulkModal) bulkCancel.addEventListener('click', () => bulkModal.style.display = 'none');
});

// select-all and bulk-assign handling for items page
document.addEventListener('DOMContentLoaded', () => {
  const selectAll = document.getElementById('selectAll');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checked = e.target.checked;
      document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = checked);
    });
  }

  const bulkAssignForm = document.getElementById('bulkAssignForm');
  if (bulkAssignForm) {
    bulkAssignForm.addEventListener('submit', (e) => {
      // ensure at least one item selected
      const any = Array.from(document.querySelectorAll('.item-checkbox')).some(cb => cb.checked);
      if (!any) {
        e.preventDefault();
        alert('Select at least one item to assign');
      }
    });
  }
});
