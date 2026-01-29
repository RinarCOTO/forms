# RPFAAS Forms Application

A modern web application for Real Property Field Appraisal & Assessment Sheet (RPFAAS) forms management built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## 🚀 Features

### Core Features
- **Dashboard Homepage** - Centralized hub for all forms and submissions
- **Building & Structures Form** - Complete 5-step property assessment form
- **Save at Any Step** - Save your progress to database from any form step
- **Save & Edit Functionality** - Save drafts and continue editing anytime
- **Status Tracking** - Track submissions through draft, pending, approved, rejected stages
- **Supabase Integration** - Cloud database with real-time sync
- **Multi-step Forms** - Intuitive step-by-step form filling process

### User Features
- **Create New Forms** - Start fresh submissions from the dashboard
- **Save Draft Anytime** - Click "Save Draft" button on any step (1-5) to save progress to database
- **Edit Drafts** - Continue where you left off with automatic data loading
- **View Submissions** - See all your forms in an organized table
- **Status Badges** - Visual indicators for form status
- **Print Preview** - Review forms before submitting
- **Auto-save to LocalStorage** - Form data temporarily stored while filling
- **Persistent Drafts** - Saved drafts persist across sessions in database

### Technical Features
- **Type-Safe** - Built with TypeScript for reliability
- **Modern UI** - Clean interface with shadcn/ui components
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Authentication** - Secure user authentication system
- **RLS Security** - Row-level security in Supabase
- **API Routes** - RESTful API for CRUD operations

## 🛠️ Technologies

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: React Hooks + LocalStorage

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier available)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/forms.git
cd forms
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Set up Supabase database:
Run the SQL in `CREATE_COMPLETE_DATABASE.sql` in your Supabase SQL editor

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) - automatically redirects to dashboard

## 📝 Usage

### Creating a New Form
1. Visit the dashboard (homepage)
2. Click on **Building & Structures** card
3. Click **New Submission**
4. Fill out the form steps (you can save at any step)
5. Click **Save Draft** button at any step to save progress to database
6. Continue to next steps or come back later to edit
7. Preview your submission
8. **Save as Draft** (to continue later) or **Submit Form** (for review)

### Saving Progress
- **Save Draft Button** available on all 5 form steps (Step 1-5)
- Click **Save Draft** on any step to save current progress to database
- Form data persists in database and can be accessed from any device
- Draft ID is automatically stored for subsequent updates
- Each save updates the existing draft (no duplicate entries)

### Editing a Draft
1. From dashboard, click **Building & Structures**
2. Find your draft in the submissions table
3. Click **Edit** button
4. Form automatically loads with your saved data
5. Make changes across any of the 5 steps
6. Click **Save Draft** on any step to update
7. Save or submit when ready

### Viewing Submissions
- Dashboard shows submission counts for each form type
- Click any form type to see detailed table view
- Status badges show: Draft (gray), Pending (yellow), Approved (green), Rejected (red)
- Use View/Edit buttons to access submissions

## 🗂️ Project Structure

```
app/
├── page.tsx                          # Homepage (redirects to dashboard)
├── dashboard/                        # Main dashboard
├── building-other-structure/
│   └── fill/
│       ├── step-1/                   # Location & property details
│       ├── step-2/                   # Owner & building info
│       ├── step-3/                   # Structural materials
│       ├── step-4/                   # Building systems
│       ├── step-5/                   # Assessment & valuation
│       └── preview-form/             # Preview & submit
├── api/
│   ├── building-structure/           # CRUD operations
│   │   └── [id]/                     # Get/Update/Delete by ID
│   └── forms/
│       └── building-structures/      # List all submissions
└── components/                       # Reusable UI components

## 🔌 API Endpoints

### Building Structures
- `GET /api/forms/building-structures` - List all submissions
- `GET /api/building-structure/:id` - Get single submission
- `POST /api/building-structure` - Create new submission
- `PUT /api/building-structure/:id` - Update existing submission
- `DELETE /api/building-structure/:id` - Delete submission

## 💾 Database Schema

### building_structures Table
```sql
- id (serial primary key)
- owner_name (varchar)
- type_of_building (varchar)
- number_of_storeys (integer)
- total_floor_area (decimal)
- roofing_material (varchar)
- wall_material (varchar)
- flooring_material (varchar)
- estimated_value (decimal)
- status (varchar) - draft/pending/approved/rejected
- created_at (timestamp)
- updated_at (timestamp)
```

## 🏗️ Building for Production

```bash
npm run build
npm start
```

## 📦 Deployment

### Deploy to Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

1. Push your code to GitHub (see instructions above)
2. Go to [Vercel](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Click "Deploy"

Vercel will automatically detect Next.js and configure the build settings.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
