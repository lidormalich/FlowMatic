import React from 'react';
import { Paper, Typography } from '@material-ui/core';

const AppointmentSummary = ({ selectedDate, selectedSlot, customerDetails, onClose }) => {
    return (
        <div style={{ padding: '16px', marginBottom: '8px', position: 'relative' }}>

            <Typography variant="h3" align="center" gutterBottom>
                פרטי התור
            </Typography>
            <div style={{ padding: '8px 16px' }}>
                <Typography variant="body1" align="center" paragraph>
                    שלום! נפגש ב<strong>{selectedDate}</strong> בשעה <strong>{selectedSlot}</strong> לטיפוח בסטודיו שלי.
                </Typography>
                <Typography variant="body1" align="center" paragraph>
                    סידרנו טיפולים ל<strong>{customerDetails.services.join(', ')}</strong>.
                </Typography>
            </div>
            <Typography variant="body2" align="center" paragraph>
                מצפה לראותך!
            </Typography>
            <Typography variant="body2" align="center" paragraph>
                רבקה        לג ג'ל
            </Typography>
            <div style={{ marginTop: '16px' }}>
                <Typography variant="body2" align="center" color="textSecondary" paragraph>
                    <em>*ניתן גם להוסיף את התור ליומן שלך.</em>
                </Typography>
                <Typography variant="body2" align="center" color="textSecondary" paragraph>
                    <em>**ביטולים מתאפשרים רק בטלפון.</em>
                </Typography>
            </div>
        </div>
    );
};

export default AppointmentSummary;
