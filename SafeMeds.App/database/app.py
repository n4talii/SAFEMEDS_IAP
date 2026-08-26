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

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM inventory")
    items = cursor.fetchall()
    
    for item in items:
        if item.get('last_restocked'):
            item['item_restocked'] = str(item['last_restocked'])
            
    cursor.close()
    conn.close()
    return jsonify(items)

if __name__== '__main__':
    app.run(port=5000, debug=True)            