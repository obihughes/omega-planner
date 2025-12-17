// Run this in the browser console to clear day view settings
// This will reset the daily planner to show today (top) and tomorrow (bottom)

console.log('Clearing day view settings...');
localStorage.removeItem('dayViewSettings');
console.log('Day view settings cleared! Please refresh the page.');
console.log('The daily planner should now show:');
console.log('- Top view: Today (offset 0)');
console.log('- Bottom view: Tomorrow (offset 1)');
