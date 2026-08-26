document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
});

async function loadInventory() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/inventory');
        if(!response.ok) throw Error(`HTTP error! status: ${response.status}`);

        const items = await response.json();
        const container = document.getElementById('inventory-rows-container');
        container.innerHTML =  '';

        items.forEach(item => {
            const badgeClass = `badge-${item.safety_rating.toLowerCase()}`;

            const row = document.createElement('div');
            row.className = 'table-row';
            row.innerHTML = `
                <input class="metric-checkbox" type="checkbox" />
                <div class="col-name"><span>${item.name}</span></div>
                <div class="col-sku">${item.sku}</div>
                <div class="col-cat">${item.category}</div>
                <div class="col-stock">${item.current_stock}</div>
                <div class="col-reorder">${item.reorder_point}</div>
                <div class="col-restocked">${item.last_restocked}</div>
                <div class="col-rating">
                    <span class="badge ${badgeClass}">${item.safety_rating}</span>
                </div>
                <div class="col-action">
                    <a href="#" class="edit-btn" data-id="${item.id}">Edit</a> / 
                    <a href="#" class="order-btn" data-id="${item.id}">Order</a>
                </div>
            `;
            container.appendChild(row);
        });
    } catch (error) {
        console.error('Failed to load inventory data:', error);
    }
}