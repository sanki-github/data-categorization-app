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
  const selectAllHeader = document.getElementById('selectAllHeader');
  
  // Function to toggle all checkboxes
  const toggleAllCheckboxes = (checked) => {
    document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = checked);
    // Sync both select-all checkboxes
    if (selectAll) selectAll.checked = checked;
    if (selectAllHeader) selectAllHeader.checked = checked;
  };
  
  // Handle the existing select all checkbox in the form
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      toggleAllCheckboxes(e.target.checked);
    });
  }
  
  // Handle the new select all checkbox in the table header
  if (selectAllHeader) {
    selectAllHeader.addEventListener('change', (e) => {
      toggleAllCheckboxes(e.target.checked);
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
