// Materials
async getMaterials(): Promise<Material[]> {
  console.log('Fetching materials from SQLite database');
  
  return new Promise((resolve, reject) => {
    this.db.all('SELECT * FROM materials ORDER BY name', (err, rows) => {
      if (err) {
        console.error('Error in getMaterials:', err);
        return reject(err);
      }
      
      const materials = rows.map(row => ({
        id: row.id,
        name: row.name,
        price: row.price,
        stock: row.stock,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      resolve(materials);
    });
  });
}

async getMaterial(id: number): Promise<Material | undefined> {
  console.log(`Fetching material with ID ${id} from SQLite database`);
  
  return new Promise((resolve, reject) => {
    this.db.get('SELECT * FROM materials WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error(`Error in getMaterial(${id}):`, err);
        return reject(err);
      }
      
      if (!row) {
        return resolve(undefined);
      }
      
      const material = {
        id: row.id,
        name: row.name,
        price: row.price,
        stock: row.stock,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      resolve(material);
    });
  });
}

async createMaterial(material: InsertMaterial): Promise<Material> {
  console.log('Creating new material in SQLite database:', material);
  
  const now = new Date().toISOString();
  
  // Verify all required fields are present
  if (!material.name) {
    throw new Error('Material name is required');
  }
  
  if (material.price === undefined) {
    throw new Error('Material price is required');
  }
  
  return new Promise((resolve, reject) => {
    try {
      this.db.run(
        `INSERT INTO materials (name, category, price, unit, stock, description, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          material.name,
          material.category || 'عمومی', // Default category if not provided
          material.price,
          material.unit || 'عدد', // Default unit if not provided
          material.stock || 0,
          material.description || '',
          now,
          now
        ],
        function(err) {
          if (err) {
            console.error('Error in createMaterial:', err);
            return reject(err);
          }
          
          const id = this.lastID;
          
          const newMaterial = {
            id,
            ...material,
            createdAt: now,
            updatedAt: now
          };
          
          resolve(newMaterial);
        }
      );
    } catch (error) {
      console.error('Unexpected error in createMaterial:', error);
      reject(error);
    }
  });
}

async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
  console.log(`Updating material with ID ${id} in SQLite database:`, material);
  
  // First check if material exists
  const existingMaterial = await this.getMaterial(id);
  if (!existingMaterial) {
    return undefined;
  }
  
  const now = new Date().toISOString();
  const updates = [];
  const values = [];
  
  if (material.name !== undefined) {
    updates.push('name = ?');
    values.push(material.name);
  }
  
  if (material.price !== undefined) {
    updates.push('price = ?');
    values.push(material.price);
  }
  
  if (material.stock !== undefined) {
    updates.push('stock = ?');
    values.push(material.stock);
  }
  
  if (material.description !== undefined) {
    updates.push('description = ?');
    values.push(material.description);
  }
  
  // Always update the updated_at timestamp
  updates.push('updated_at = ?');
  values.push(now);
  
  // Add the ID for the WHERE clause
  values.push(id);
  
  return new Promise((resolve, reject) => {
    this.db.run(
      `UPDATE materials SET ${updates.join(', ')} WHERE id = ?`,
      values,
      (err) => {
        if (err) {
          console.error(`Error in updateMaterial(${id}):`, err);
          return reject(err);
        }
        
        // Get the updated material
        this.getMaterial(id)
          .then(updatedMaterial => resolve(updatedMaterial))
          .catch(err => reject(err));
      }
    );
  });
} 