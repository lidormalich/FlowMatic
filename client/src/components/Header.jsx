import React from 'react';
const Header = () => {
    return (
        <header className="bg-blue-600 text-white py-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                {/* כפתור תפריט עם אייקון המבורגר */}
                <div className='flex justify-end items-start flex-col'>
                    <span className="flex items-center">
                        <img src={`${process.env.PUBLIC_URL}/flowMatic3.png`} alt="Logo" className="h-10 w-10 mr-2" />
                        <h1 className="text-2xl font-bold m-0 p-0">FlowMatic</h1>
                    </span>
                    <p className="italic mx-5">ניהול תורים בקליק</p>
                </div>
            </div>
            {/* <button className="text-white focus:outline-none">
                <i className="fas fa-bars"></i>
            </button> */}
        </header>
    );
};

export default Header;
