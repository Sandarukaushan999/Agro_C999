const mongoose = require('mongoose')
const Solution = require('../src/models/Solution')
const User = require('../src/models/User')
const { connectDB } = require('../src/config/database')
require('dotenv').config()

// Hardcoded solutions data
const solutionsData = [
  {
    plant: 'strawberry',
    disease: 'powdery_mildew',
    description: 'Powdery mildew is a fungal disease that appears as white, powdery spots on leaves, stems, and fruits. It thrives in humid conditions and can significantly reduce plant vigor and fruit quality.',
    symptoms: [
      'White, powdery coating on leaves and stems',
      'Distorted or stunted growth',
      'Yellowing of affected leaves',
      'Reduced fruit size and quality',
      'Premature leaf drop'
    ],
    treatment: [
      'Apply sulfur-based fungicides every 7-10 days',
      'Use potassium bicarbonate sprays',
      'Remove and destroy infected plant parts',
      'Improve air circulation around plants',
      'Apply neem oil as organic treatment'
    ],
    prevention: [
      'Plant resistant varieties when available',
      'Ensure proper spacing between plants',
      'Avoid overhead watering',
      'Maintain good air circulation',
      'Remove plant debris regularly',
      'Apply preventive fungicides in early spring'
    ],
    severity: 'medium',
    affectedParts: ['leaves', 'stems', 'fruits'],
    seasonality: ['spring', 'summer', 'fall'],
    environmentalFactors: ['high humidity', 'poor air circulation', 'crowded plants'],
    organicTreatment: [
      'Milk spray (1:10 ratio)',
      'Baking soda solution',
      'Neem oil applications',
      'Sulfur dust'
    ],
    chemicalTreatment: [
      'Myclobutanil fungicides',
      'Propiconazole treatments',
      'Tebuconazole applications'
    ]
  },
  {
    plant: 'tomato',
    disease: 'bacterial_spot',
    description: 'Bacterial spot is caused by Xanthomonas bacteria and appears as small, dark spots on leaves, stems, and fruits. It can cause significant yield loss in humid conditions.',
    symptoms: [
      'Small, dark, water-soaked spots on leaves',
      'Spots may have yellow halos',
      'Spots on stems and fruits',
      'Leaf yellowing and defoliation',
      'Fruit cracking and rot'
    ],
    treatment: [
      'Apply copper-based bactericides',
      'Use streptomycin sprays',
      'Remove infected plant material',
      'Improve drainage and air circulation',
      'Apply biological control agents'
    ],
    prevention: [
      'Use disease-free seeds and transplants',
      'Practice crop rotation',
      'Avoid overhead irrigation',
      'Maintain proper plant spacing',
      'Sanitize tools and equipment',
      'Remove plant debris promptly'
    ],
    severity: 'high',
    affectedParts: ['leaves', 'stems', 'fruits'],
    seasonality: ['summer', 'fall'],
    environmentalFactors: ['high humidity', 'warm temperatures', 'wet conditions'],
    organicTreatment: [
      'Copper fungicides',
      'Bacillus subtilis applications',
      'Compost tea sprays'
    ],
    chemicalTreatment: [
      'Copper hydroxide',
      'Streptomycin sulfate',
      'Oxytetracycline'
    ]
  },
  {
    plant: 'corn',
    disease: 'leaf_blight',
    description: 'Northern corn leaf blight is a fungal disease that causes elongated, tan to brown lesions on leaves. It can reduce photosynthesis and grain yield significantly.',
    symptoms: [
      'Elongated, tan to brown lesions on leaves',
      'Lesions may have dark borders',
      'Premature leaf death',
      'Reduced plant vigor',
      'Lower grain yield'
    ],
    treatment: [
      'Apply fungicides containing azoxystrobin',
      'Use propiconazole treatments',
      'Apply tebuconazole sprays',
      'Remove infected plant debris',
      'Improve field drainage'
    ],
    prevention: [
      'Plant resistant hybrids',
      'Practice crop rotation',
      'Avoid planting in wet conditions',
      'Maintain proper plant density',
      'Remove crop residues',
      'Apply preventive fungicides'
    ],
    severity: 'high',
    affectedParts: ['leaves'],
    seasonality: ['summer', 'fall'],
    environmentalFactors: ['high humidity', 'warm temperatures', 'wet conditions'],
    organicTreatment: [
      'Copper fungicides',
      'Bacillus subtilis',
      'Compost applications'
    ],
    chemicalTreatment: [
      'Azoxystrobin',
      'Propiconazole',
      'Tebuconazole',
      'Trifloxystrobin'
    ]
  },
  {
    plant: 'apple',
    disease: 'scab',
    description: 'Apple scab is a fungal disease that causes dark, scaly lesions on leaves and fruits. It can severely impact fruit quality and marketability.',
    symptoms: [
      'Dark, scaly lesions on leaves',
      'Velvety, olive-green spots',
      'Corky, cracked lesions on fruits',
      'Premature leaf drop',
      'Reduced fruit quality'
    ],
    treatment: [
      'Apply fungicides containing captan',
      'Use myclobutanil treatments',
      'Apply sulfur-based fungicides',
      'Remove infected plant material',
      'Improve air circulation'
    ],
    prevention: [
      'Plant resistant varieties',
      'Prune for good air circulation',
      'Remove fallen leaves and debris',
      'Apply preventive fungicides',
      'Avoid overhead irrigation',
      'Maintain proper tree spacing'
    ],
    severity: 'medium',
    affectedParts: ['leaves', 'fruits', 'twigs'],
    seasonality: ['spring', 'summer'],
    environmentalFactors: ['high humidity', 'cool temperatures', 'wet conditions'],
    organicTreatment: [
      'Sulfur fungicides',
      'Copper sprays',
      'Bacillus subtilis',
      'Compost tea'
    ],
    chemicalTreatment: [
      'Captan',
      'Myclobutanil',
      'Propiconazole',
      'Trifloxystrobin'
    ]
  },
  {
    plant: 'potato',
    disease: 'late_blight',
    description: 'Late blight is a devastating fungal disease that can cause complete crop loss. It appears as dark, water-soaked lesions on leaves and stems.',
    symptoms: [
      'Dark, water-soaked lesions on leaves',
      'White, fuzzy growth on undersides of leaves',
      'Rapid plant death',
      'Dark lesions on stems',
      'Tuber rot in storage'
    ],
    treatment: [
      'Apply fungicides containing chlorothalonil',
      'Use metalaxyl treatments',
      'Apply copper fungicides',
      'Remove infected plants immediately',
      'Improve field drainage'
    ],
    prevention: [
      'Plant certified disease-free seed',
      'Practice crop rotation',
      'Avoid overhead irrigation',
      'Remove volunteer plants',
      'Apply preventive fungicides',
      'Harvest in dry conditions'
    ],
    severity: 'critical',
    affectedParts: ['leaves', 'stems', 'tubers'],
    seasonality: ['summer', 'fall'],
    environmentalFactors: ['high humidity', 'cool temperatures', 'wet conditions'],
    organicTreatment: [
      'Copper fungicides',
      'Bacillus subtilis',
      'Compost applications'
    ],
    chemicalTreatment: [
      'Chlorothalonil',
      'Metalaxyl',
      'Propamocarb',
      'Famoxadone'
    ]
  },
  {
    plant: 'grape',
    disease: 'black_rot',
    description: 'Black rot is a fungal disease that causes circular, dark lesions on leaves and fruits. It can significantly reduce grape yield and quality.',
    symptoms: [
      'Circular, dark lesions on leaves',
      'Brown, shriveled fruits',
      'Black, mummified berries',
      'Premature leaf drop',
      'Reduced vine vigor'
    ],
    treatment: [
      'Apply fungicides containing myclobutanil',
      'Use captan treatments',
      'Apply sulfur-based fungicides',
      'Remove infected plant material',
      'Improve air circulation'
    ],
    prevention: [
      'Plant resistant varieties',
      'Prune for good air circulation',
      'Remove infected plant debris',
      'Apply preventive fungicides',
      'Avoid overhead irrigation',
      'Maintain proper vine spacing'
    ],
    severity: 'high',
    affectedParts: ['leaves', 'fruits', 'stems'],
    seasonality: ['spring', 'summer'],
    environmentalFactors: ['high humidity', 'warm temperatures', 'wet conditions'],
    organicTreatment: [
      'Sulfur fungicides',
      'Copper sprays',
      'Bacillus subtilis',
      'Compost tea'
    ],
    chemicalTreatment: [
      'Myclobutanil',
      'Captan',
      'Propiconazole',
      'Trifloxystrobin'
    ]
  }
]

async function populateSolutions() {
  try {
    // Connect to database
    await connectDB()
    
    // Create admin user if not exists
    let adminUser = await User.findOne({ email: 'admin@agro-c.com' })
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@agro-c.com',
        password: 'admin123', // Change this in production
        role: 'admin'
      })
      console.log('Admin user created')
    }
    
    // Clear existing solutions
    await Solution.deleteMany({})
    console.log('Existing solutions cleared')
    
    // Insert new solutions
    const solutions = solutionsData.map(solution => ({
      ...solution,
      createdBy: adminUser._id,
      lastUpdatedBy: adminUser._id
    }))
    
    await Solution.insertMany(solutions)
    console.log(`${solutions.length} solutions inserted successfully`)
    
    // Display inserted solutions
    const insertedSolutions = await Solution.find({})
    console.log('\nInserted solutions:')
    insertedSolutions.forEach(solution => {
      console.log(`- ${solution.plant} - ${solution.disease}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error populating solutions:', error)
    process.exit(1)
  }
}

// Run the script
populateSolutions()
