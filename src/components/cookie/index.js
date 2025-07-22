import React, { useState, useEffect } from 'react';
import './index.scss';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      setShowConsent(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowConsent(false);
  };


  return (
    showConsent &&
    <div className="cookie-consent">
      <div className="cookie-consent__content">
        <p className="cookie-consent__text">
          By clicking <strong>"Ok, got it"</strong>, you agree to the storing of cookies on your device to enhance navigation, analyze site usage, and assist in our marketing efforts. View our Privacy Policy for more information.
        </p>
        <button className="cookie-consent__button" onClick={handleAccept}>
          Ok, got it
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;