const HallDetails = () => {
    // ... other code ...

    return (
        <div className="container mx-auto px-4 py-8">
            {/* ... other JSX ... */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-bold mb-4">{hall.name}</h2>
                    <p className="text-gray-600 mb-4">{hall.about}</p>
                    <div className="space-y-2">
                        <p><span className="font-semibold">Speciality:</span> {hall.speciality}</p>
                        <p><span className="font-semibold">Capacity:</span> {hall.experience}</p>
                        <p><span className="font-semibold">Type:</span> {hall.isGuestRoom ? 'Guest Room' : 'Hall'}</p>
                        <p><span className="font-semibold">Address:</span> {hall.address.line1}, {hall.address.line2}</p>
                    </div>
                </div>
                {/* ... rest of the component ... */}
            </div>
        </div>
    )
} 