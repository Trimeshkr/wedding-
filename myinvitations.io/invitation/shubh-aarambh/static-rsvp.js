/* Static preview RSVP: sends guest response through WhatsApp without WordPress backend. */
(function () {
  const form = document.querySelector('.im-guest-rsvp__form');
  if (!form) return;

  const submit = form.querySelector('.im-guest-rsvp__submit');
  const choices = form.querySelectorAll('.im-guest-rsvp__choice');
  const guestName = form.querySelector('[name="guest_name"]');
  const guestCount = form.querySelector('[name="guest_count"]');
  const mobile = form.querySelector('[name="guest_mobile"]');
  const countryCode = form.querySelector('[name="guest_mobile_code"]');
  let attendance = 'coming';

  form.dataset.isPreview = 'static-whatsapp';
  if (submit) {
    submit.disabled = false;
    submit.textContent = 'Send RSVP on WhatsApp';
  }

  choices.forEach((button) => {
    button.addEventListener('click', () => {
      attendance = button.dataset.value || 'coming';
      choices.forEach((item) => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      const details = form.querySelector('.im-guest-rsvp__details');
      if (details) details.style.opacity = attendance === 'coming' ? '1' : '0.65';
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const name = (guestName?.value || '').trim();
    if (!name) {
      guestName?.focus();
      alert('Please enter your name.');
      return;
    }

    const count = Math.max(1, Number(guestCount?.value || 1));
    const events = [...form.querySelectorAll('[name="selected_events[]"]:checked')].map((input) => input.value);
    const guestPhone = mobile?.value.trim() ? (countryCode?.value || '+91') + mobile.value.trim() : 'Not provided';

    let hostNumber = localStorage.getItem('wedding-rsvp-whatsapp-number') || '';
    if (!hostNumber) {
      hostNumber = prompt('Enter the wedding host WhatsApp number with country code (e.g. 919876543210). This will be saved on this device.');
      if (!hostNumber) return;
      hostNumber = hostNumber.replace(/[^0-9]/g, '');
      if (hostNumber.length < 10) {
        alert('Please enter a valid WhatsApp number including country code.');
        return;
      }
      localStorage.setItem('wedding-rsvp-whatsapp-number', hostNumber);
    }

    const status = attendance === 'coming' ? 'We will attend' : 'We cannot attend';
    const message = [
      'Wedding RSVP',
      '',
      'Name: ' + name,
      'Response: ' + status,
      'Guests: ' + count,
      'Events: ' + (events.length ? events.join(', ') : 'Not selected'),
      'Guest mobile: ' + guestPhone,
      '',
      'Sent from the wedding invitation website.'
    ].join('\n');

    window.open('https://wa.me/' + hostNumber + '?text=' + encodeURIComponent(message), '_blank', 'noopener');
  }, true);
})();
