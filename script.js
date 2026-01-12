// Creating the empty shopping basket and totals
let cart = [];
let subtotal = 0; // sum of item base prices
let taxTotal = 0; // sum of taxes (15% per item)
let total = 0; // subtotal + taxTotal

// Configuration: set mode to 'auto' to try Flask then fallback to localStorage,
// or set to 'flask', 'local', or 'supabase' explicitly.
const BACKEND_MODE = 'auto';
// If you want to use Supabase, set these values (not recommended in public client)
const SUPABASE_URL = '';
const SUPABASE_KEY = ''; // Service role key should never be in client-side code

// Finding all the "Add to Cart" buttons
const addButtons = document.querySelectorAll('.product-card .btn-danger');
const cartBtn = document.querySelector('.btn-outline-light');

// manipulating  each button when user clicks
addButtons.forEach((button) => {
  button.addEventListener('click', () => {
    
    // Finding the food details nearby
    const productCard = button.closest('.product-card');
    const name = productCard.querySelector('.product-name').innerText;
    const priceText = productCard.querySelector('.price-badge').innerText;
    
    // converting "$10" into the number 10 (allow decimals)
    const price = parseFloat(priceText.replace('$', '')) || 0;

    // calculate tax (15% per item) and total price for this item
    const tax = Math.round(price * 0.15 * 100) / 100; // two decimals
    const itemTotal = Math.round((price + tax) * 100) / 100;

    // Placing the item in our basket (store price, tax, and itemTotal)
    cart.push({ name: name, price: price, tax: tax, totalPrice: itemTotal });

    // Update running totals
    subtotal += price;
    taxTotal += tax;
    total += itemTotal;

    // Updating the "Cart" button at the top
    cartBtn.innerText = `🛒 Cart (${cart.length}) - $${total.toFixed(2)}`;
    
    // Giving user a "Success" animation
    button.innerText = "Added! ✅";
    button.classList.replace('btn-danger', 'btn-success');
    
    setTimeout(() => {
      button.innerText = "Add to Cart";
      button.classList.replace('btn-success', 'btn-danger');
    }, 1000);
  });
});

// Show the final list when clicking the Cart button
cartBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    alert("Your cart is empty! Time to order! 🍕");
  } else {
    let receipt = "Your Order:\n";
    cart.forEach((item, index) => {
      receipt += `${index + 1}. ${item.name} - $${item.price.toFixed(2)} (tax $${item.tax.toFixed(2)}) = $${item.totalPrice.toFixed(2)}\n`;
    });
    receipt += `\nSubtotal: $${subtotal.toFixed(2)}\n`;
    receipt += `Tax (15%): $${taxTotal.toFixed(2)}\n`;
    receipt += `Total: $${total.toFixed(2)}\n\nThank you for ordering from Taste Haven!`;
    alert(receipt);
  }
});

// Booking confirmation handler for the modal
async function confirmBooking() {
  try {
    const form = document.getElementById('bookingForm');
    const nameEl = document.getElementById('bookingName');
    const datetimeEl = document.getElementById('bookingDatetime');
    const peopleEl = document.getElementById('bookingPeople');

    // Reset previous validation state
    [nameEl, datetimeEl, peopleEl].forEach(el => {
      el.classList.remove('is-invalid');
    });

    let valid = true;

    // Name validation
    if (!nameEl.value || !nameEl.value.trim()) {
      nameEl.classList.add('is-invalid');
      valid = false;
    }

    // Datetime validation (must be present and in future)
    if (!datetimeEl.value) {
      datetimeEl.classList.add('is-invalid');
      valid = false;
    } else {
      const chosen = new Date(datetimeEl.value);
      const now = new Date();
      if (isNaN(chosen.getTime()) || chosen <= now) {
        datetimeEl.classList.add('is-invalid');
        valid = false;
      }
    }

    // People validation
    const peopleCount = parseInt(peopleEl.value, 10);
    if (!peopleEl.value || isNaN(peopleCount) || peopleCount < 1) {
      peopleEl.classList.add('is-invalid');
      valid = false;
    }

    if (!valid) {
      // Let the user fix the inputs
      return;
    }

    // All good: post booking to backend API
    const payload = {
      name: nameEl.value.trim(),
      datetime: datetimeEl.value,
      people: peopleCount
    };

    // Unified booking submission flow
    const tryPostToFlask = async (payload) => {
      const resp = await fetch('http://127.0.0.1:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error((data && data.errors) ? data.errors.join('; ') : 'Server error');
      return data.booking;
    };

    const saveBookingLocal = (payload) => {
      const existing = JSON.parse(localStorage.getItem('localBookings') || '[]');
      existing.push({ ...payload, savedAt: new Date().toISOString() });
      localStorage.setItem('localBookings', JSON.stringify(existing));
    };

    const postToSupabase = async (payload) => {
      if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase not configured');
      // WARNING: This is an example. Using service role keys in client code is insecure.
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('Supabase request failed');
      // Supabase may return empty body depending on settings; return payload for confirmation
      return payload;
    };

    try {
      let booking;
      if (BACKEND_MODE === 'local') {
        saveBookingLocal(payload);
        booking = { client: { name: payload.name }, datetime: payload.datetime, people: payload.people };
      } else if (BACKEND_MODE === 'supabase') {
        await postToSupabase(payload);
        booking = { client: { name: payload.name }, datetime: payload.datetime, people: payload.people };
      } else { // 'auto' or 'flask'
        try {
          booking = await tryPostToFlask(payload);
        } catch (err) {
          console.warn('Flask backend failed, saving locally:', err);
          saveBookingLocal(payload);
          booking = { client: { name: payload.name }, datetime: payload.datetime, people: payload.people };
        }
      }

      const confirmationText = `Reservation for ${booking.client.name} on ${new Date(booking.datetime).toLocaleString()} for ${booking.people} people confirmed.`;
      // Update screen-reader live region
      const sr = document.getElementById('sr-live');
      if (sr) sr.textContent = confirmationText;

      // Close modal
      const modalEl = document.getElementById('bookingModal');
      if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.hide();
      }

      alert(confirmationText + (BACKEND_MODE === 'local' || BACKEND_MODE === 'auto' ? ' (saved locally)' : ''));
      form.reset();
    } catch (err) {
      console.error('Booking request error:', err);
      alert('Booking failed: ' + (err.message || err));
    }
  } catch (err) {
    console.error('Booking confirm error:', err);
  }
}
  