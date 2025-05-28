import db from '../server/db.js';

// Wait for database to be ready
setTimeout(() => {
  console.log('Starting Mochi recipe update...');

  // First try to find the existing Mochi recipe
  db.get(
    "SELECT * FROM recipes WHERE name LIKE ? OR name LIKE ? OR name LIKE ?",
    ['%موچی%', '%mochi%', '%Mochi%'],
    (err, recipe) => {
      if (err) {
        console.error('Error finding recipe:', err);
        process.exit(1);
      }

      if (!recipe) {
        console.log('Mochi recipe not found, creating new recipe...');
        
        // Create a new Mochi recipe
        db.run(
          `INSERT INTO recipes (name, category, price_coefficient, description, image_url)
           VALUES (?, ?, ?, ?, ?)`,
          [
            'موچی',
            'Dessert',
            3.3,
            'موچی دسر سنتی ژاپنی',
            'attached_assets/recipe_images/mochi.jpg'
          ],
          function(err) {
            if (err) {
              console.error('Error creating recipe:', err);
              process.exit(1);
            }
            
            console.log('Created new recipe with ID:', this.lastID);
            
            // Get the newly created recipe
            db.get(
              "SELECT * FROM recipes WHERE id = ?",
              [this.lastID],
              (err, newRecipe) => {
                if (err) {
                  console.error('Error getting new recipe:', err);
                  process.exit(1);
                }
                console.log('Final recipe state:', newRecipe);
                process.exit(0);
              }
            );
          }
        );
      } else {
        console.log('Found existing recipe:', recipe);
        
        // Update the image URL
        db.run(
          "UPDATE recipes SET image_url = ? WHERE id = ?",
          ['attached_assets/recipe_images/mochi.jpg', recipe.id],
          (err) => {
            if (err) {
              console.error('Error updating recipe:', err);
              process.exit(1);
            }
            
            console.log(`Updated recipe ${recipe.id} with new image URL`);
            
            // Get the updated recipe
            db.get(
              "SELECT * FROM recipes WHERE id = ?",
              [recipe.id],
              (err, updatedRecipe) => {
                if (err) {
                  console.error('Error getting updated recipe:', err);
                  process.exit(1);
                }
                console.log('Final recipe state:', updatedRecipe);
                process.exit(0);
              }
            );
          }
        );
      }
    }
  );
}, 1000); // Wait 1 second for database to be ready 