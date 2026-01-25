import React from 'react';

const UserSelector: React.FC = () => {
    const [user, setUser] = React.useState(localStorage.getItem('dev_user') || 'alice');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newUser = e.target.value;
        setUser(newUser);
        localStorage.setItem('dev_user', newUser);
        window.location.reload(); // Reload to refresh permissions
    };

    return (
        <div className="flex items-center gap-2 border p-2 rounded-md bg-muted/20">
            <span className="text-sm font-medium">Dev User:</span>
            <select
                value={user}
                onChange={handleChange}
                className="border rounded px-2 py-1 bg-background text-foreground text-sm"
            >
                <option value="alice">Alice (Uploader)</option>
                <option value="bob">Bob (Approver)</option>
                <option value="admin">Admin</option>
            </select>
        </div>
    );
};

export default UserSelector;
