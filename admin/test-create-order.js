// Test creating an order
import { sqliteStorage } from './server/storage-sqlite.js';

async function testCreateOrder() {
  console.log('Testing order creation...');
  
  try {
    // Generate a unique order number
    const now = new Date();
    const jalaliDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      numberingSystem: 'latn'
    }).format(now).replace(/\//g, '');
    
    const jalaliTime = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      numberingSystem: 'latn'
    }).format(now);
    
    // Create a test order
    const testOrder = {
      orderNumber: `TEST-${jalaliDate}-${Math.floor(Math.random() * 1000)}`,
      totalAmount: 150000,
      isPaid: false,
      status: 'pending',
      jalaliDate: jalaliDate.substring(0, 4) + '/' + jalaliDate.substring(4, 6) + '/' + jalaliDate.substring(6, 8),
      jalaliTime
    };
    
    console.log('Creating test order:', testOrder);
    
    // Create the order
    const createdOrder = await sqliteStorage.createOrder(testOrder);
    console.log('Order created successfully:', createdOrder);
    
    // Add an order item
    const testOrderItem = {
      orderId: createdOrder.id,
      menuItemId: 1,
      menuItemName: 'تست کافه لاته',
      price: 75000,
      quantity: 2,
      totalPrice: 150000
    };
    
    console.log('Adding order item:', testOrderItem);
    
    // Add the order item
    const createdOrderItem = await sqliteStorage.addOrderItem(testOrderItem);
    console.log('Order item added successfully:', createdOrderItem);
    
    // Check if sales summary was updated
    const summary = await sqliteStorage.getSalesSummaryByDate(testOrder.jalaliDate);
    console.log('Sales summary for today:', summary);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testCreateOrder(); 