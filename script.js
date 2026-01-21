
let cart = [];
let totalWithTax = 0;

const cartBtn = document.querySelector('.btn-light'); // the cart button 
const cartCount = document.getElementById('cart-count'); // the cart item count display
const FLASK_URL = 'http://127.0.0.1:5000/api/bookings'; // the Flask backend URL (kitchen)

const addButtons = document.querySelectorAll('.product-card .btn-danger'); // all "Add to Cart" buttons

addButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const card = button.closest('.product-card'); // getting the closest product card
        const name = card.querySelector('.product-name').innerText; // Selecting product name
        const priceText = card.querySelector('.price-badge').innerText; //Selecting product price text
        const price = parseFloat(priceText.replace('$', '')); // converting price text to float

        // calculating 15% tax
        const tax = price * 0.15;
        const finalItemPrice = price + tax;

        //Saving it to the list
        cart.push({
            itemName: name,
            basePrice: price,
            taxAmount: tax,
            total: finalItemPrice
        });
        // updating total with tax to the whole cart
        totalWithTax += finalItemPrice;
        cartCount.innerText = cart.length; // updating cart item count display
        cartBtn.innerHTML=`🛒 Cart ($${totalWithTax.toFixed(2)})`; // updating cart button display
        button.innerText = 'Added! ✅';
        setTimeout(() => {button.innerText = 'Add to Cart 🛒';}, 1000); // reverting button text after 1 second
    });

});

// Communicating with Flask backend to confirm booking
async function confirmBooking() {
    const name =document.getElementById('bookingName').value;
    const time = document.getElementById('bookingDateTime').value;
    const people = document.getElementById('bookingGuests').value;

    if (!name || !time || !people) {
        alert('Please fill in all booking details.');
        return;
    }

    const orderData = {
        name: name,
        datetime: time,
        people: parseInt(people),
    };
    try {
        const response = await fetch(FLASK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });

        if (response.ok) {
            alert('Booking confirmed! We look forward to serving you.');
            // Closing the pop-up
            // Reloading the page to reset the form. 
        
            location.reload();
        }
    } catch (error) {
        alert("Unfortunately, the kitchen is currently closed. Please try again later.");
    }

}
// Function to show cart details in a modal
function showCart() {
    const list = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('cart-subtotal');
    const taxEl = document.getElementById('cart-tax');
    const totalEl = document.getElementById('cart-total');

    list.innerHTML = '';
    let subtotal = 0;
    let totalTax = 0;

    cart.forEach((item, index) => {
        subtotal += item.basePrice;
        totalTax += item.taxAmount;

        const li = document.createElement('li');
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        
        //A bin for removing items from the cart
        li.innerHTML = `
            <div>
                <strong>${item.itemName}</strong>
                <br><small class="text-muted">Tax: $${item.taxAmount.toFixed(2)}</small>
            </div>
            <div>
                <span class="me-3">$${item.basePrice.toFixed(2)}</span>
                <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${index})">&times;</button>
            </div>
        `;
        list.appendChild(li);
    });

    subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
    taxEl.innerText = `$${totalTax.toFixed(2)}`;
    totalEl.innerText = `$${(subtotal + totalTax).toFixed(2)}`;

    if (cart.length === 0) {
        list.innerHTML = '<li class="list-group-item text-center">Your cart is empty!</li>';
    }
}

// A function that removes an item from the cart if customer changes their mind.
function removeFromCart(index) {
    //Subtracting the item's total (price + tax) from our grand total
    totalWithTax -= cart[index].total;

    //Removing the item from the array using its position (index)
    cart.splice(index, 1);

    //Updating the red bubble on the navigation bar
    const cartCount = document.getElementById('cart-count');
    const cartBtn = document.querySelector('.btn-light');
    
    cartCount.innerText = cart.length;
    cartBtn.innerHTML = `🛒 Cart ($${totalWithTax.toFixed(2)})`;

    //Redrawing the cart so the item vanishes from the screen
    showCart();
}
