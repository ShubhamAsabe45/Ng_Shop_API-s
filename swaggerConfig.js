const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Ng_Shop API Documentation',
    version: '1.0.0',
    description: 'API for managing products, categories, users, and orders.',
  },
  servers: [
    {
      url: 'https://ng-shop-api-s.onrender.com', 
      // url: 'http://localhost:8480/',
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'ObjectId',
            example: '60b7b39e75b8b53c445d0191',
          },
          name: {
            type: 'string',
            example: 'Electronics',
          },
          icon: {
            type: 'string',
            example: 'fa-solid fa-laptop',
          },
          color: {
            type: 'string',
            example: '#000000',
          },
        },
        required: ['name'],
      },
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'ObjectId',
            example: '60b7b39e75b8b53c445d0191',
          },
          orderItems: {
            type: 'array',
            items: {
              type: 'string',
              format: 'ObjectId',
              example: '60b8b39e75b8b53c445d0191',
            },
          },
          shippingAdress1: {
            type: 'string',
            example: '123 Main St',
          },
          shippingAdress2: {
            type: 'string',
            example: 'Apt 4B',
          },
          city: {
            type: 'string',
            example: 'San Francisco',
          },
          zip: {
            type: 'string',
            example: '94107',
          },
          country: {
            type: 'string',
            example: 'USA',
          },
          phone: {
            type: 'string',
            example: '+1 123 456 7890',
          },
          status: {
            type: 'string',
            example: 'Pending',
          },
          totalPrice: {
            type: 'number',
            example: 150.00,
          },
          user: {
            type: 'string',
            format: 'ObjectId',
            example: '60b7c39e75b8b53c445d0191',
          },
          dateOrdered: {
            type: 'string',
            format: 'date-time',
            example: '2023-07-21T12:00:00Z',
          },
        },
        required: ['orderItems', 'shippingAdress1', 'city', 'zip', 'country', 'phone', 'status'],
      },
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'ObjectId',
            example: '60b7b39e75b8b53c445d0191',
          },
          name: {
            type: 'string',
            example: 'Laptop',
          },
          description: {
            type: 'string',
            example: 'A high-performance laptop.',
          },
          richDescription: {
            type: 'string',
            example: 'This is a powerful laptop with excellent build quality.',
          },
          image: {
            type: 'string',
            example: 'http://example.com/images/laptop.jpg',
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
              example: 'http://example.com/images/laptop-side.jpg',
            },
          },
          brand: {
            type: 'string',
            example: 'BrandName',
          },
          price: {
            type: 'number',
            example: 999.99,
          },
          category: {
            type: 'string',
            format: 'ObjectId',
            example: '60b7b39e75b8b53c445d0191',
          },
          countInStock: {
            type: 'number',
            example: 50,
          },
          rating: {
            type: 'number',
            example: 4.5,
          },
          numReviews: {
            type: 'number',
            example: 100,
          },
          isFeatured: {
            type: 'boolean',
            example: true,
          },
          dateCreated: {
            type: 'string',
            format: 'date-time',
            example: '2023-07-21T12:00:00Z',
          },
        },
        required: ['name', 'description', 'category', 'price'],
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'ObjectId',
            example: '60b7b39e75b8b53c445d0191',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            example: 'johndoe@example.com',
          },
          password: {
            type: 'string',
            example: 'password123',
          },
          phone: {
            type: 'string',
            example: '+1 123 456 7890',
          },
          isAdmin: {
            type: 'boolean',
            example: false,
          },
          street: {
            type: 'string',
            example: '123 Main St',
          },
          apartment: {
            type: 'string',
            example: 'Apt 4B',
          },
          zip: {
            type: 'string',
            example: '94107',
          },
          city: {
            type: 'string',
            example: 'San Francisco',
          },
          country: {
            type: 'string',
            example: 'USA',
          },
        },
        required: ['name', 'email', 'password', 'phone'],
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Your route files where you document your APIs
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
