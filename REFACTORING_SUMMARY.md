# ATS Entity Refactoring Summary

This document summarizes all changes made to refactor the ATS entities to match the UML diagram.

## New Enums Created

### 1. CVStatus.java
- Values: `PENDING`, `PARSING`, `PARSED`, `PARSED_FAILED`, `SCORED`, `REVIEWED`
- Used in: `CVs` entity

### 2. JobStatus.java
- Values: `OPEN`, `CLOSED`
- Used in: `JobPosting` entity

### 3. MatchMethod.java
- Values: `EXACT`, `FUZZY`
- Used in: `CVSkills` entity

### 4. SkillType.java
- Values: `TECHNICAL`, `SOFT`, `LANGUAGE`, `CERTIFICATE`
- Used in: `Skills` entity

### 5. Role.java (Updated)
- **OLD**: `ADMIN`, `USER`
- **NEW**: `RECRUITER`, `ADMIN`

## Entities Updated

### 1. User.java
- Updated `isRole()` method to properly compare roles
- Still uses `Role` enum (now with RECRUITER, ADMIN values)

### 2. JobPosting.java
- **Added fields**:
  - `jobPostingId` (Long, Primary Key)
  - `user` (ManyToOne relationship)
  - `title` (String)
  - `description` (TEXT)
  - `requirements` (TEXT)
  - `status` (JobStatus enum, defaults to OPEN)
  - `createdAt` (LocalDateTime)
  - `updatedAt` (LocalDateTime with @PreUpdate)
- **Relationships**:
  - `OneToMany` with `CVs` (cvs list)
  - `OneToMany` with `JobRequiredSkill` (requiredSkills list)

### 3. CVs.java
- **Added fields**:
  - `cvId` (Long, Primary Key)
  - `jobPosting` (ManyToOne relationship)
  - `candidateName` (String)
  - `email` (String)
  - `phone` (String)
  - `filePath` (String)
  - `status` (CVStatus enum, defaults to PENDING)
  - `rawNlpResult` (TEXT)
  - `uploadedAt` (LocalDateTime)
- **Relationships**:
  - `OneToOne` with `MatchResult`
  - `OneToMany` with `CVSkills` (cvSkills list)
  - `OneToMany` with `CVEducation` (educations list)
  - `OneToMany` with `CVExperience` (experiences list)

### 4. Skills.java
- **Added fields**:
  - `skillId` (Long, Primary Key, auto-generated)
  - `name` (String, unique)
  - `type` (SkillType enum)
  - `category` (ManyToOne relationship with SkillCategory)
- **Relationships**:
  - `OneToMany` with `SkillAlias` (aliases list)
  - `OneToMany` with `JobRequiredSkill` (jobRequiredSkills list)
  - `OneToMany` with `CVSkills` (cvSkills list)

### 5. SkillCategory.java
- **Added fields**:
  - `categoryId` (Long, Primary Key)
  - `name` (String, unique)
  - `description` (String)
  - `parent` (ManyToOne self-reference for hierarchy)
- **Relationships**:
  - `OneToMany` with self (children list for hierarchical categories)
  - `OneToMany` with `Skills` (skills list)

### 6. CVSkills.java
- **Added fields**:
  - `id` (Long, Primary Key)
  - `cv` (ManyToOne relationship)
  - `skill` (ManyToOne relationship)
  - `matchMethod` (MatchMethod enum)
  - `confidence` (Double)

### 7. CVEducation.java
- **Added fields**:
  - `id` (Long, Primary Key)
  - `cv` (ManyToOne relationship)
  - `institution` (String)
  - `degree` (String)
  - `fieldOfStudy` (String)
  - `startDate` (LocalDate)
  - `endDate` (LocalDate)
  - `grade` (String)

### 8. MatchResult.java
- **Added fields**:
  - `matchResultId` (Long, Primary Key)
  - `cv` (OneToOne relationship, unique)
  - `jaccardScore` (Double)
  - `cosineScore` (Double)
  - `educationScore` (Double)
  - `overallScore` (Double)
  - `calculatedAt` (LocalDateTime)

## New Entities Created

### 1. JobRequiredSkill.java
- **Composite Primary Key**: (jobPostingId, skillId)
- **Fields**:
  - `jobPosting` (ManyToOne relationship, part of PK)
  - `skill` (ManyToOne relationship, part of PK)
  - `requiredLevel` (Integer, defaults to 1)
- **Companion class**: `JobRequiredSkillId` (Serializable, for composite key)

### 2. SkillAlias.java
- **Fields**:
  - `aliasId` (Long, Primary Key)
  - `skill` (ManyToOne relationship)
  - `aliasName` (String, unique)
- **Purpose**: Store skill synonyms for matching (e.g., "JS" → "JavaScript")

### 3. CVExperience.java
- **Fields**:
  - `id` (Long, Primary Key)
  - `cv` (ManyToOne relationship)
  - `company` (String)
  - `position` (String)
  - `startDate` (LocalDate)
  - `endDate` (LocalDate)
  - `description` (TEXT)
  - `current` (Boolean, defaults to false)
- **Purpose**: Store extracted work experience from CVs

## Entity Relationships Summary

```
User (1) ----< (many) JobPosting
JobPosting (1) ----< (many) CVs
JobPosting (1) ----< (many) JobRequiredSkill
Skills (1) ----< (many) JobRequiredSkill
CVs (1) ----< (many) CVSkills
Skills (1) ----< (many) CVSkills
Skills (1) ----< (many) SkillAlias
SkillCategory (1) ----< (many) Skills
SkillCategory (1) ----< (many) SkillCategory (self-referencing hierarchy)
CVs (1) ----(1) MatchResult
CVs (1) ----< (many) CVEducation
CVs (1) ----< (many) CVExperience
```

## Key Design Patterns Used

1. **Composite Primary Key**: Used in `JobRequiredSkill` for many-to-many relationship with attributes
2. **Self-Referencing Hierarchy**: Used in `SkillCategory` for hierarchical categories (e.g., "Programming" → "Web Development" → "Frontend")
3. **Enum-Based State Management**: Status tracking using enums (CVStatus, JobStatus)
4. **Automatic Timestamps**: `@PreUpdate` in JobPosting, `uploadedAt` and `calculatedAt` auto-initialized
5. **Cascade Operations**: `CascadeType.ALL` with `orphanRemoval=true` for proper entity lifecycle management

## Database Tables Created

1. `tbl_job_posting`
2. `tbl_cv`
3. `tbl_skills`
4. `tbl_skill_category`
5. `tbl_cv_skills`
6. `tbl_cv_education`
7. `tbl_cv_experience`
8. `tbl_match_result`
9. `tbl_job_required_skill`
10. `tbl_skill_alias`
11. `tbl_users` (existing, but Role enum values changed)

## Breaking Changes

### ⚠️ Role Enum Changed
- **Impact**: Existing users with `USER` role will need migration
- **Old values**: `ADMIN`, `USER`
- **New values**: `RECRUITER`, `ADMIN`
- **Migration needed**: Update existing `tbl_users` records where `role = 'USER'` to `role = 'RECRUITER'`

## Next Steps

1. **Database Migration**:
   - Create database migration script for existing data
   - Migrate `USER` role to `RECRUITER` role
   - Create new tables for all new entities

2. **Repository Layer**:
   - Create repositories for all new entities
   - Update existing repositories if needed

3. **Service Layer**:
   - Implement business logic for CV parsing
   - Implement skill matching algorithms (Jaccard, Cosine similarity)
   - Implement education scoring logic
   - Create overall score calculation service

4. **Controller Layer**:
   - Create REST endpoints for job postings
   - Create CV upload and parsing endpoints
   - Create skill management endpoints
   - Create match result retrieval endpoints

5. **Testing**:
   - Unit tests for entities and relationships
   - Integration tests for repositories
   - Service layer tests for matching algorithms

## Verification

✅ All entities compile successfully
✅ All relationships properly defined
✅ All enums created and integrated
✅ Composite keys properly implemented
✅ Cascade operations configured
✅ Timestamps and auto-generation configured
