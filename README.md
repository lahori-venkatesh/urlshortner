# 🔗 Pebly - Advanced URL Shortener & QR Generator

A modern, full-stack URL shortener with QR code generation, file sharing, and analytics. Built with React, Spring Boot, and MongoDB.

## ✨ Features

### 🚀 **Core Features**
- **URL Shortening** - Create short, memorable links
- **QR Code Generation** - Customizable QR codes with live preview
- **File Sharing** - Upload files and get shareable links
- **Analytics Dashboard** - Real-time click tracking and insights
- **User Authentication** - Google OAuth & email/password
- **Custom Domains** - Use your own domain (Premium)

### 🎨 **Advanced Features**
- **Live QR Preview** - Sticky preview while customizing
- **Bulk Operations** - Manage multiple links at once
- **Password Protection** - Secure your links
- **Expiration Dates** - Auto-expire links
- **Rate Limiting** - API protection
- **Responsive Design** - Works on all devices

### 📊 **Analytics**
- Click tracking with geolocation
- Device and browser analytics
- Referrer tracking
- Real-time statistics
- Export capabilities

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications

### **Backend**
- **Spring Boot 3** with Java 17
- **MongoDB** for data storage
- **Redis** for caching
- **Spring Security** for authentication
- **Maven** for dependency management
- **Docker** support

### **Deployment**
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud

## 📁 Project Structure

```
pebly/
├── backend/                    # Spring Boot backend
│   └── url-service/           # Main service
│       ├── src/main/java/     # Java source code
│       ├── src/main/resources/ # Configuration files
│       └── pom.xml            # Maven dependencies
├── frontend/                   # React frontend
│   ├── src/                   # Source code
│   ├── public/                # Static assets
│   └── package.json           # NPM dependencies
├── scripts/                   # Deployment scripts
│   ├── backup.sh              # Database backup
│   ├── deploy-production.sh   # Production deployment
│   └── setup-production.sh    # Production setup
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── LICENSE                    # MIT License
└── README.md                  # Project documentation
```
- **Database**: MongoDB Atlas
- **Cache**: Render Redis

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16+
- Java 17+
- MongoDB
- Redis (optional)

### **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

### **Backend Setup**
```bash
cd backend
./mvnw spring-boot:run
```

### **Environment Variables**
Copy `.env.example` to `.env` and configure:
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/pebly
REDIS_HOST=localhost

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payment
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## 📁 Project Structure

```
pebly/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── context/        # React context
│   └── public/
├── backend/                 # Spring Boot backend
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration files
│   └── pom.xml            # Maven dependencies
├── scripts/                # Deployment scripts
└── docs/                  # Documentation
```

## 🔧 API Endpoints

### **Authentication**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/google` - Google OAuth

### **URLs**
- `POST /api/v1/urls` - Create short URL
- `GET /api/v1/urls/user/{userId}` - Get user URLs
- `PUT /api/v1/urls/{shortCode}` - Update URL
- `DELETE /api/v1/urls/{shortCode}` - Delete URL

### **QR Codes**
- `POST /api/v1/qr` - Generate QR code
- `GET /api/v1/qr/user/{userId}` - Get user QR codes
- `PUT /api/v1/qr/{qrId}` - Update QR code
- `DELETE /api/v1/qr/{qrId}` - Delete QR code

### **Files**
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/user/{userId}` - Get user files
- `DELETE /api/v1/files/{fileCode}` - Delete file

### **Analytics**
- `GET /api/v1/analytics/user/{userId}` - User analytics
- `GET /api/v1/analytics/url/{shortCode}` - URL analytics
- `POST /api/v1/urls/{shortCode}/click` - Record click

## 🚀 Deployment

### **Production Deployment**
See [deploy.md](deploy.md) for detailed deployment instructions.

### **Quick Deploy**
1. **Backend (Render)**:
   - Connect GitHub repository
   - Set environment variables
   - Deploy automatically

2. **Frontend (Vercel)**:
   - Connect GitHub repository
   - Set environment variables
   - Deploy automatically

## 📊 Performance

### **Backend Performance**
- Connection pooling for MongoDB
- Redis caching for frequent queries
- Async processing for analytics
- Rate limiting for API protection

### **Frontend Performance**
- Code splitting with React.lazy
- Image optimization
- Bundle size optimization
- CDN delivery via Vercel

## 🔒 Security

### **Backend Security**
- JWT authentication
- CORS protection
- Input validation
- Rate limiting
- SQL injection prevention

### **Frontend Security**
- Environment variable protection
- XSS prevention
- CSRF protection
- Secure API communication

## 🧪 Testing

### **Frontend Testing**
```bash
cd frontend
npm test
```

### **Backend Testing**
```bash
cd backend
./mvnw test
```

## 📈 Monitoring

### **Health Checks**
- Backend: `/actuator/health`
- Metrics: `/actuator/metrics`
- Prometheus: `/actuator/prometheus`

### **Logging**
- Structured logging with Logback
- Error tracking and monitoring
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Spring Boot team for the robust backend framework
- MongoDB for the flexible database
- Vercel and Render for hosting platforms

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/pebly/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/pebly/discussions)
- **Email**: support@pebly.com

---

**Made with ❤️ by [Your Name]**

⭐ Star this repository if you found it helpful!