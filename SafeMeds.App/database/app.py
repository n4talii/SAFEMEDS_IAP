from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="safemeds_db"
    )

@app.route('/api/inventory', methods=['GET','POST'])
def inventory():
    conn = get_db_connection()
    
    # 1. Handle GET: Fetch and display items on the dashboard
    if request.method == 'GET':
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM inventory")
        items = cursor.fetchall()
        
        for item in items:
            if item.get('last_restocked'):
                item['last_restocked'] = str(item['last_restocked'])
                
        cursor.close()
        conn.close()
        return jsonify(items), 200        
    
    # 2. Handle POST: Insert new item from the frontend form
    elif request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400
        
    
        cursor = conn.cursor()
        query = """
            INSERT INTO inventory (name, sku, category, current_stock, reorder_point, last_restocked, safety_rating)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            data['name'],
            int(data['sku']),
            data(['category']),
            int(data['current_stock']),
            int(data['reorder_point']),
            data['last_restocked'],
            data['safety_rating']
        )
        cursor.execute(query, values)
        conn.commit()
        
        cursor.close()
        conn.close()
        return jsonify({"message": "Medicine has been added successfully"}), 201
    

if __name__== '__main__':
    app.run(port=5000, debug=True)     
    
    
    # items = cursor.fetchall()
    
    # for item in items:
    #     if item.get('last_restocked'):
    #         item['item_restocked'] = str(item['last_restocked'])
            
    # cursor.close()
    # conn.close()
    # return jsonify(items)       