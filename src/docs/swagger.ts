import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Ventas",
      version: "1.0.0",
      description: "Documentación de la API de ventas con Swagger",
    },
    components: {
      schemas: {
        ProductVariant: { 
            type: "object", 
            required: [ 
                "_id",
                "name",
                "description",
                "created_at",
                "updated_at",
                "image_url", 
                "gallery_urls",
                "brand",
                "product_id",
                "sku",
                "model_type",
                "model_size", 
                "min_stock","stock",
                "price",
                "expiration_date" 
            ], 
            properties: { 
                _id: { type: "string" }, 
                name: { type: "string" }, 
                description: { type: "string" }, 
                created_at: { type: "string" }, 
                updated_at: { type: "string" }, 
                image_url: { type: "string" }, 
                gallery_urls: { type: "array", items: { type: "string" } }, 
                brand: { type: "string" }, 
                product_id: { type: "string" }, 
                sku: { type: "string" }, 
                model_type: { type: "string" }, 
                model_size: { type: "string" }, 
                min_stock: { type: "number" }, 
                stock: { type: "number" }, 
                price: { type: "number" }, 
                expiration_date: { type: "string" } 
            } 
        },
        Sell: {
          type: "object",
          properties: {
            ticket_id: { type: "string" },
            purchase_date: { type: "string" },
            modification_date: { type: "string" },
            seller_id: { type: "string" },
            seller_name: { type: "string" },
            payment_method: { type: "string" },
            products: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductVariant" }
            },
            sub_total: { type: "number" },
            iva: { type: "number" },
            total_amount: { type: "number" },
            currency: { type: "string" }
          }
        },
        CreateSellPayload: {
          allOf: [{ $ref: "#/components/schemas/Sell" }],
          required: ["purchase_date", "seller_id", "seller_name", "products", "total_amount"]
        },
        EditSellPayload: {
          allOf: [{ $ref: "#/components/schemas/Sell" }],
          required: ["ticket_id"]
        },
        GetSellsByProductPayload: {
          type: "object",
          properties: {
            ticket_id: { type: "string" }
          },
          required: ["ticket_id"]
        }
      }
    }
  },
  apis: [
    "./src/routes/*.ts",
    "./src/controllers/*.ts"
  ]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
