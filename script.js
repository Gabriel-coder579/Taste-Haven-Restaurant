// The Memory (Notepad)
let cart = [];
let total = 0;

// Assigning my api (the waiter) to talk to my backend (kitchen)
const FLASK_API_URL = 'http://127.0.0.1:5000/api/bookings';

//SHOPPING CART LOGIC

const addButtons = document.querySelectorAll('.product-card .btn-danger');
const cartBtn = document.querySelector('.btn-outline-light');

addButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const productCard = button.closest('.product-card');
    const name = productCard.querySelector('.product-name').innerText;
    const priceText = productCard.querySelector('.price-badge').innerText;
    const price = parseFloat(priceText.replace('$', '')) || 0;

    cart.push({ name, price });
    total += price;

    cartBtn.innerText = `🛒 Cart (${cart.length}) - $${total.toFixed(2)}`;
    
    button.innerText = "Added! ✅";
    button.classList.replace('btn-danger', 'btn-success');
    setTimeout(() => {
      button.innerText = "Add to Cart";
      button.classList.replace('btn-success', 'btn-danger');
    }, 1000);
  });
});

async function confirmBooking() {

  const nameEl = document.getElementById('bookingName');
  const datetimeEl = document.getElementById('bookingDatetime');
  const peopleEl = document.getElementById('bookingPeople');

  
  if (!nameEl.value || !datetimeEl.value || !peopleEl.value) {
    alert("Please fill in all the details! 📝");
    return;
  }

  
  const payload = {
    name: nameEl.value.trim(),
    datetime: datetimeEl.value,
    people: parseInt(peopleEl.value)
  };

  try {
    const response = await fetch(FLASK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      alert(`Success! Reservation for ${result.booking.client.name} is saved! 🎉`);
      
      // Closing the pop-up
      const modalEl = document.getElementById('bookingModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      modalInstance.hide();
      
      // Clear the form
      nameEl.value = '';
      datetimeEl.value = '';
      peopleEl.value = '';
    } else {
      alert("Booking failed: " + result.errors.join(", "));
    }
  } catch (error) {
    // If my Python server is not turned on
    console.error("Error:", error);
    alert("Could not connect to the server.");
  }
}
