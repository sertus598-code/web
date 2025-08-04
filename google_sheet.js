const scriptURL = 'https://script.google.com/macros/s/AKfycbyaEtZ9ynZU5SlO1wt6vQyIuwbaUGyjQ-46jP8k_snNiMEVPrfHu7LvrytsVgtwQSKe/exec'

const form = document.forms['contact-form']

form.addEventListener('submit', e => {
  e.preventDefault()
  fetch(scriptURL, { method: 'POST', body: new FormData(form)})
  .then(response => alert("Multumim, cererea dvs a fost inregistrata in baza noastra de date." ))
  .then(() => { window.location.reload(); })
  .catch(error => console.error('Error!', error.message))
})
