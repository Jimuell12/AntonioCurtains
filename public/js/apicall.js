export function sendEmail(email, sb, message) {
    const apiUrl = 'https://acusltdco.pythonanywhere.com/send_email';
    const to = email;
    const subject = sb;
    const body = message;
    const urlWithParams = `${apiUrl}?to=${to}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    fetch(urlWithParams, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            console.log('API Response:', data);
        })
        .catch(error => {
            console.error('API Error:', error);
        });
}