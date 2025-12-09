const handleError = (message, isSuccess = false) => {
  document.getElementById('errorMessage').textContent = message;
  const messageElement = document.getElementById('domoMessage');
  messageElement.classList.remove('hidden');
  
  if (isSuccess) {
    messageElement.classList.add('success');
  } else {
    messageElement.classList.remove('success');
  }
};

const sendPost = async (url, data, handler) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  document.getElementById('domoMessage').classList.add('hidden');

  if(result.redirect) {
    window.location = result.redirect;
  }

  if(result.error) {
    handleError(result.error);
  }

  if(handler) {
    handler(result);
  }
};

const hideError = () => {
    document.getElementById('domoMessage').classList.add('hidden');
};

module.exports = {
    handleError,
    sendPost,
    hideError,
}