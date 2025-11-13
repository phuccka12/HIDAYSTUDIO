import fetch from 'node-fetch';

async function testAPI() {
  try {
    // Test server health
    const response = await fetch('http://localhost:4000/');
    const data = await response.json();
    console.log('Server health:', data);

    // Test target score update
    const userId = '68f05c5a75170c26160f9ff2';
    const updateResponse = await fetch(`http://localhost:4000/users/${userId}/progress/writing/target`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_score: 8.0 })
    });

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('Target score update:', updateData);
    } else {
      console.log('Error updating target score:', updateResponse.status, await updateResponse.text());
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAPI();