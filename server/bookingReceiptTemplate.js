function generateBookingReceiptTemplate({ hotel, poweredBy, booking }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Booking Receipt - Franc Hotel</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background: #f5f7fb;">
    <div style="background: #f5f7fb; padding: 40px 20px; display: flex; justify-content: center;">
      <div style="width: 100%; max-width: 1000px; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
        
        <!-- Header Wave -->
        <div style="background: linear-gradient(90deg, #caa15b 0%, #e8d2a8 40%, #b8863d 100%); height: 12px;"></div>
        
        <!-- Header -->
        <div style="padding: 30px 40px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 60px; height: 60px; background: #2563eb; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: bold;">FH</div>
            <div style="font-size: 34px; font-weight: 700; color: #1e293b;">${hotel.name}</div>
          </div>
          
          <div style="text-align: right; color: #475569; line-height: 1.8; font-size: 15px;">
            <div>${hotel.phone}</div>
            <div>${hotel.email}</div>
            <div>${hotel.website}</div>
            <div>${hotel.location}</div>
          </div>
        </div>
        
        <!-- Body -->
        <div style="padding: 0 40px 40px;">
          <div style="font-size: 42px; font-weight: 700; margin-bottom: 10px; color: #0f172a;">Booking Receipt</div>
          <div style="color: #64748b; font-size: 18px; margin-bottom: 35px;">
            Thank you for your booking, your reservation details are below.
          </div>
          
          <div style="border: 3px solid #dbeafe; border-radius: 20px; padding: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            
            <!-- LEFT SIDE -->
            <div>
              <div style="font-size: 28px; font-weight: 700; margin-bottom: 20px; color: #1e293b;">Booking Details</div>
              
              <div style="background: #f8fafc; border-radius: 15px; padding: 25px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Confirmation</span>
                  <strong>${booking.confirmationCode}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Check-In</span>
                  <strong>${booking.checkIn}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Check-Out</span>
                  <strong>${booking.checkOut}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Guest</span>
                  <strong>${booking.guestName}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Guests Count</span>
                  <strong>${booking.guestCount}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Room Number</span>
                  <strong>${booking.roomNumber}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Duration</span>
                  <strong>${booking.duration}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 17px;">
                  <span>Total</span>
                  <strong>${booking.totalPrice}</strong>
                </div>
              </div>
              
              <div style="font-size: 28px; font-weight: 700; margin-bottom: 20px; color: #1e293b;">Booking Summary</div>
              
              <div style="background: #f8fafc; border-radius: 15px; padding: 25px;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Price per Night</span>
                  <strong>${booking.pricePerNight}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 17px;">
                  <span>Total Paid</span>
                  <strong>${booking.totalPrice}</strong>
                </div>
              </div>
            </div>
            
            <!-- RIGHT SIDE -->
            <div>
              <img src="https://via.placeholder.com/500x250/f8fafc/64748b?text=Room+Image" alt="Room" style="width: 100%; border-radius: 15px; object-fit: cover; margin-bottom: 20px; height: 250px;">
              
              <div style="background: #f8fafc; border-radius: 15px; padding: 25px;">
                <div style="font-size: 28px; font-weight: 700; margin-bottom: 20px; color: #1e293b;">${booking.roomType} Room</div>
                
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Room Type</span>
                  <strong>${booking.roomType}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Bed Type</span>
                  <strong>${booking.bedType}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Capacity</span>
                  <strong>${booking.capacity}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                  <span>Size</span>
                  <strong>${booking.size}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 17px;">
                  <span>Pet Friendly</span>
                  <strong>${booking.petFriendly}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 40px; padding: 30px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${hotel.name}</h3>
              <p style="margin: 5px 0; color: #475569;">${hotel.phone}</p>
              <p style="margin: 5px 0; color: #475569;">${hotel.email}</p>
              <p style="margin: 5px 0; color: #475569;">${hotel.website}</p>
            </div>
            <div>
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">Location</h3>
              <p style="margin: 5px 0; color: #475569;">${hotel.location}</p>
            </div>
          </div>
          
          <div style="margin-top: 30px; text-align: center; border-top: 1px solid #cbd5e1; padding-top: 20px; color: #475569;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b;">
              Powered by <span style="color: #2563eb;">${poweredBy.name}</span>
            </h3>
            <p style="margin: 5px 0; color: #475569;">${poweredBy.website}</p>
            <p style="margin: 5px 0; color: #475569;">${poweredBy.email}</p>
            <p style="margin: 5px 0; color: #475569;">${poweredBy.phone}</p>
            <p style="margin: 10px 0 0 0; color: #475569;">${poweredBy.rights}</p>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

export default generateBookingReceiptTemplate;
