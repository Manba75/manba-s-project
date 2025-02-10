const socket = io.connect('http://localhost:5000');

// Listen for new order notifications
socket.on('new_order', (order) => {
  console.log('New order received:', order);
  // Handle the order in the UI (show notification, etc.)
});

// Listen for order status updates (accepted/rejected)
socket.on('order_status_update', (statusUpdate) => {
  console.log('Order status updated:', statusUpdate);
  // Handle status update in the UI
});