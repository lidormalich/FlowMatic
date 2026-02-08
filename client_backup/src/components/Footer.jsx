import React from 'react';

const Footer = () => {
    return (
        <footer className="fixed bottom-0 bg-gray-800 text-white p-4 mt-8 w-full">
            <div className="container mx-auto text-center">
                <p>© {new Date().getFullYear()} מתזמן פגישות של flowMatic. כל הזכויות שמורות.</p>
                <p>נוצר על ידי לידור מליח</p>
            </div>
        </footer>
    );
};

export default Footer;