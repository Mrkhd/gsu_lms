INSERT INTO users (id, email, password_hash, role, status, created_at, updated_at) VALUES
  ('u-admin', 'admin@lms.test', '$2b$10$rCEN3IDnWXM.DqErahJtT.oafXfCL5bZ2gM3tUxtGYbwmT6fkykue', 'ADMIN', 'ACTIVE', 1791279829284, 1791279829284),
  ('u-instructor', 'instructor@gsu.edu', '$2b$10$rCEN3IDnWXM.DqErahJtT.oafXfCL5bZ2gM3tUxtGYbwmT6fkykue', 'INSTRUCTOR', 'ACTIVE', 1791279829284, 1791279829284),
  ('u-student', 'student@lms.test', '$2b$10$rCEN3IDnWXM.DqErahJtT.oafXfCL5bZ2gM3tUxtGYbwmT6fkykue', 'STUDENT', 'ACTIVE', 1791279829284, 1791279829284),
  ('u-student2', 'student2@lms.test', '$2b$10$rCEN3IDnWXM.DqErahJtT.oafXfCL5bZ2gM3tUxtGYbwmT6fkykue', 'STUDENT', 'ACTIVE', 1791279829284, 1791279829284);

INSERT INTO profiles (id, user_id, first_name, last_name, headline, bio, avatar_url, created_at, updated_at) VALUES
  ('p-admin', 'u-admin', 'Sara', 'Admin', 'Platform owner', NULL, NULL, 1791279829284, 1791279829284),
  ('p-instructor', 'u-instructor', 'Amira', 'Hassan', 'Instructor, GSU Postgraduate', 'Teaches across the postgraduate programs.', NULL, 1791279829284, 1791279829284),
  ('p-student', 'u-student', 'Layla', 'Noor', NULL, NULL, NULL, 1791279829284, 1791279829284),
  ('p-student2', 'u-student2', 'Omar', 'Saleh', NULL, NULL, NULL, 1791279829284, 1791279829284);

INSERT INTO course_categories (id, name, slug, description, created_at, updated_at) VALUES
  ('cat-web', 'Web Development', 'web-development', 'Build for the web.', 1791279829284, 1791279829284),
  ('cat-programming', 'Programming', 'programming', 'General programming skills.', 1791279829284, 1791279829284);

INSERT INTO courses (id, title, slug, short_description, description, thumbnail_url, level, price, access_duration_days, status, what_you_learn, requirements, category_id, instructor_id, published_at, created_at, updated_at) VALUES
  ('c-html', 'HTML & CSS Fundamentals', 'html-css-fundamentals', 'HTML & CSS Fundamentals course.', 'HTML & CSS Fundamentals is a hands-on course.', NULL, 'BEGINNER', 25, 180, 'PUBLISHED', '["Write semantic HTML","Style with CSS"]', '["A computer with internet access"]', 'cat-web', 'u-instructor', 1791279829284, 1791279829284, 1791279829284),
  ('c-js', 'JavaScript Fundamentals', 'javascript-fundamentals', 'JavaScript Fundamentals course.', 'JavaScript Fundamentals is a hands-on course.', NULL, 'BEGINNER', 35, 180, 'PUBLISHED', '["Understand the DOM","Write async code"]', '["A computer with internet access"]', 'cat-web', 'u-instructor', 1791279829284, 1791279829284, 1791279829284),
  ('c-react', 'React Fundamentals', 'react-fundamentals', 'React Fundamentals course.', 'React Fundamentals is a hands-on course.', NULL, 'BEGINNER', 45, 180, 'PUBLISHED', '["Build components","Manage state"]', '["A computer with internet access"]', 'cat-web', 'u-instructor', 1791279829284, 1791279829284, 1791279829284),
  ('c-node', 'Node.js Fundamentals', 'nodejs-fundamentals', 'Node.js Fundamentals course.', 'Node.js Fundamentals is a hands-on course.', NULL, 'BEGINNER', 40, 180, 'PUBLISHED', '["Build APIs","Understand the event loop"]', '["A computer with internet access"]', 'cat-web', 'u-instructor', 1791279829284, 1791279829284, 1791279829284),
  ('c-python', 'Python for Beginners', 'python-for-beginners', 'Python for Beginners course.', 'Python for Beginners is a hands-on course.', NULL, 'BEGINNER', 30, 180, 'PUBLISHED', '["Python syntax","Data structures"]', '["A computer with internet access"]', 'cat-programming', 'u-instructor', 1791279829284, 1791279829284, 1791279829284);

INSERT INTO course_sections (id, course_id, title, position, created_at, updated_at) VALUES
  ('s-c-html', 'c-html', 'Getting started', 0, 1791279829284, 1791279829284),
  ('s-c-js', 'c-js', 'Getting started', 0, 1791279829284, 1791279829284),
  ('s-c-react', 'c-react', 'Getting started', 0, 1791279829284, 1791279829284),
  ('s-c-node', 'c-node', 'Getting started', 0, 1791279829284, 1791279829284),
  ('s-c-python', 'c-python', 'Getting started', 0, 1791279829284, 1791279829284);

INSERT INTO lessons (id, course_id, section_id, title, type, video_url, content, pdf_url, duration_minutes, position, is_preview, created_at, updated_at) VALUES
  ('l-c-html-1', 'c-html', 's-c-html', 'HTML & CSS Fundamentals: Introduction', 'VIDEO', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL, NULL, 10, 0, 1, 1791279829284, 1791279829284),
  ('l-c-html-2', 'c-html', 's-c-html', 'HTML & CSS Fundamentals: Core concepts', 'TEXT', NULL, 'Study the core concepts.', NULL, 15, 1, 0, 1791279829284, 1791279829284),
  ('l-c-js-1', 'c-js', 's-c-js', 'JavaScript Fundamentals: Introduction', 'VIDEO', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL, NULL, 10, 0, 1, 1791279829284, 1791279829284),
  ('l-c-js-2', 'c-js', 's-c-js', 'JavaScript Fundamentals: Core concepts', 'TEXT', NULL, 'Study the core concepts.', NULL, 15, 1, 0, 1791279829284, 1791279829284),
  ('l-c-react-1', 'c-react', 's-c-react', 'React Fundamentals: Introduction', 'VIDEO', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL, NULL, 10, 0, 1, 1791279829284, 1791279829284),
  ('l-c-react-2', 'c-react', 's-c-react', 'React Fundamentals: Core concepts', 'TEXT', NULL, 'Study the core concepts.', NULL, 15, 1, 0, 1791279829284, 1791279829284),
  ('l-c-node-1', 'c-node', 's-c-node', 'Node.js Fundamentals: Introduction', 'VIDEO', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL, NULL, 10, 0, 1, 1791279829284, 1791279829284),
  ('l-c-node-2', 'c-node', 's-c-node', 'Node.js Fundamentals: Core concepts', 'TEXT', NULL, 'Study the core concepts.', NULL, 15, 1, 0, 1791279829284, 1791279829284),
  ('l-c-python-1', 'c-python', 's-c-python', 'Python for Beginners: Introduction', 'VIDEO', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL, NULL, 10, 0, 1, 1791279829284, 1791279829284),
  ('l-c-python-2', 'c-python', 's-c-python', 'Python for Beginners: Core concepts', 'TEXT', NULL, 'Study the core concepts.', NULL, 15, 1, 0, 1791279829284, 1791279829284);

INSERT INTO bundles (id, title, slug, short_description, description, thumbnail_url, price, access_duration_days, status, published_at, created_at, updated_at) VALUES
  ('b-webdev', 'Web Development Bundle', 'web-development-bundle', 'Everything you need to become a web developer.', 'HTML, CSS, JavaScript, React and Node.js.', NULL, 80, 180, 'PUBLISHED', 1791279829284, 1791279829284, 1791279829284),
  ('b-sem-1', 'Semester 1 — Foundations', 'semester-1', 'Courses for semester 1.', 'Semester 1 of the BSc Computer Science program.', NULL, 1200, 120, 'PUBLISHED', 1791279829284, 1791279829284, 1791279829284),
  ('b-sem-2', 'Semester 2 — Core Computing', 'semester-2', 'Courses for semester 2.', 'Semester 2 of the BSc Computer Science program.', NULL, 1200, 120, 'PUBLISHED', 1791279829284, 1791279829284, 1791279829284),
  ('b-sem-3', 'Semester 3 — Advanced Development', 'semester-3', 'Courses for semester 3.', 'Semester 3 of the BSc Computer Science program.', NULL, 1200, 120, 'PUBLISHED', 1791279829284, 1791279829284, 1791279829284),
  ('b-sem-4', 'Semester 4 — Specialisation & Capstone', 'semester-4', 'Courses for semester 4.', 'Semester 4 of the BSc Computer Science program.', NULL, 1200, 120, 'PUBLISHED', 1791279829284, 1791279829284, 1791279829284);

INSERT INTO bundle_courses (id, bundle_id, course_id, position) VALUES
  ('bc-webdev-0', 'b-webdev', 'c-html', 0),
  ('bc-webdev-1', 'b-webdev', 'c-js', 1),
  ('bc-webdev-2', 'b-webdev', 'c-react', 2),
  ('bc-webdev-3', 'b-webdev', 'c-node', 3),
  ('bc-b-sem-1-0', 'b-sem-1', 'c-html', 0),
  ('bc-b-sem-1-1', 'b-sem-1', 'c-python', 1),
  ('bc-b-sem-2-0', 'b-sem-2', 'c-js', 0),
  ('bc-b-sem-3-0', 'b-sem-3', 'c-react', 0),
  ('bc-b-sem-4-0', 'b-sem-4', 'c-node', 0);

INSERT INTO programs (id, title, slug, code, short_description, description, thumbnail_url, level, semester_count, access_duration_days, status, published_at, created_at, updated_at) VALUES
  ('prog-cs', 'BSc Computer Science', 'bsc-computer-science', 'BSC-CS', 'A four-semester undergraduate degree.', 'Delivered across four semesters; pay per semester.', NULL, 'Bachelor', 4, 120, 'PUBLISHED', 1791279829284, 1791279829284, 1791279829284);

INSERT INTO program_semesters (id, program_id, bundle_id, number, title, created_at, updated_at) VALUES
  ('ps-1', 'prog-cs', 'b-sem-1', 1, 'Semester 1 — Foundations', 1791279829284, 1791279829284),
  ('ps-2', 'prog-cs', 'b-sem-2', 2, 'Semester 2 — Core Computing', 1791279829284, 1791279829284),
  ('ps-3', 'prog-cs', 'b-sem-3', 3, 'Semester 3 — Advanced Development', 1791279829284, 1791279829284),
  ('ps-4', 'prog-cs', 'b-sem-4', 4, 'Semester 4 — Specialisation & Capstone', 1791279829284, 1791279829284);

INSERT INTO orders (id, number, student_id, status, subtotal, discount, total, currency, provider, provider_ref, paid_at, created_at, updated_at) VALUES
  ('o1', 10001, 'u-student', 'PAID', 80, 0, 80, 'USD', 'mock', 'mock_seed', 1780911829284, 1780911829284, 1780911829284),
  ('o2', 10002, 'u-student', 'PAID', 1200, 0, 1200, 'USD', 'mock', 'mock_seed2', 1780911829284, 1780911829284, 1780911829284);

INSERT INTO order_items (id, order_id, item_type, course_id, bundle_id, title, unit_price, quantity, total_price, created_at) VALUES
  ('oi1', 'o1', 'BUNDLE', NULL, 'b-webdev', 'Web Development Bundle', 80, 1, 80, 1780911829284),
  ('oi2', 'o2', 'BUNDLE', NULL, 'b-sem-1', 'Semester 1 — Foundations', 1200, 1, 1200, 1780911829284);

INSERT INTO bundle_enrollments (id, student_id, bundle_id, source, source_id, started_at, expires_at, status, created_at, updated_at) VALUES
  ('be1', 'u-student', 'b-webdev', 'BUNDLE_PURCHASE', 'o1', 1780911829284, 1806831829284, 'ACTIVE', 1780911829284, 1780911829284),
  ('be2', 'u-student', 'b-sem-1', 'BUNDLE_PURCHASE', 'o2', 1780911829284, 1806831829284, 'ACTIVE', 1780911829284, 1780911829284);

INSERT INTO enrollments (id, student_id, course_id, bundle_id, source, source_id, started_at, expires_at, status, created_at, updated_at) VALUES
  ('e1', 'u-student', 'c-html', 'b-webdev', 'BUNDLE_PURCHASE', 'o1', 1780911829284, 1806831829284, 'ACTIVE', 1780911829284, 1780911829284),
  ('e2', 'u-student', 'c-js', 'b-webdev', 'BUNDLE_PURCHASE', 'o1', 1780911829284, 1806831829284, 'ACTIVE', 1780911829284, 1780911829284),
  ('e3', 'u-student', 'c-react', 'b-webdev', 'BUNDLE_PURCHASE', 'o1', 1780911829284, 1806831829284, 'ACTIVE', 1780911829284, 1780911829284),
  ('e4', 'u-student', 'c-node', 'b-webdev', 'BUNDLE_PURCHASE', 'o1', 1780911829284, 1806831829284, 'ACTIVE', 1780911829284, 1780911829284),
  ('e5', 'u-student', 'c-python', 'b-webdev', 'BUNDLE_PURCHASE', 'o1', 1780911829284, 1806831829284, 'ACTIVE', 1780911829284, 1780911829284);

INSERT INTO program_enrollments (id, student_id, program_id, status, current_semester, started_at, created_at, updated_at) VALUES
  ('pe1', 'u-student', 'prog-cs', 'ACTIVE', 1, 1780911829284, 1780911829284, 1780911829284);

INSERT INTO lesson_progress (id, student_id, lesson_id, course_id, completed, completed_at, last_viewed_at, created_at, updated_at) VALUES
  ('lp1', 'u-student', 'l-c-js-1', 'c-js', 1, 1780911829284, 1780911829284, 1780911829284, 1780911829284);
