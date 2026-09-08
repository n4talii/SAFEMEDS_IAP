from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
# Allow request from Live Sever (port 5500) and include POST/OPTIONS methods
CORS(app, resources={r"/api/*": {"origins": "*"}})

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="safemeds_db"
    )

@app.route('/api/inventory', methods=['GET','POST','OPTIONS'])
def inventory():
    # Handle CORS preflight check
    if request.method == 'OPTIONS' :
        return '', 200
    
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
        try:
            data = request.get_json()
            print("Received data from Frontend:", data)
            if not data:
                return jsonify({"error": "No JSON payload provided"}), 400
            # --- Validation Checker for the Safety rating ---
            if not data.get('safety_rating'):
                return jsonify({"error": "Safety rating is required"}), 400
            
        
            cursor = conn.cursor()
            query = """
                INSERT INTO inventory (name, sku, category, current_stock, reorder_point, last_restocked, safety_rating)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                data.get('name'),
                int(data.get('sku', 0)),
                data.get('category'),
                int(data.get('current_stock', 0)),
                int(data.get('reorder_point', 0)),
                data.get('last_restocked'),
                data.get('safety_rating')
            )
            cursor.execute(query, values)
            conn.commit()
            
            cursor.close()
            conn.close()
            return jsonify({"message": "Medicine has been added successfully"}), 201
        
        except Exception as e:
            print("--- BACKEND POST ERROR TRACEBACK ---")
            import traceback
            traceback.print_exc()
            print("------------------------------------")
            if conn.is_connected():
                conn.close()
            return jsonify({"error": str(e)}), 500    
    

if __name__== '__main__':
    app.run(port=5000, debug=True)     
    