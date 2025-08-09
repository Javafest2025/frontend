# Reading List API Documentation

## Overview

The Reading List API provides comprehensive functionality for managing research paper reading lists within projects. This includes adding papers, tracking reading progress, managing priorities, and generating insights.

## Base URL

```
/api/v1/projects/{projectId}/reading-list
```

## Database Schema

### Reading List Items Table

```sql
CREATE TABLE reading_list_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    project_id VARCHAR(36) NOT NULL,
    paper_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'in-progress', 'completed', 'skipped') NOT NULL DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    estimated_time INT, -- in minutes
    actual_time INT, -- in minutes
    notes TEXT,
    tags JSON, -- Array of tag strings
    rating INT CHECK (rating >= 1 AND rating <= 5),
    difficulty ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    relevance ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    reading_progress INT DEFAULT 0 CHECK (reading_progress >= 0 AND reading_progress <= 100),
    last_read_at DATETIME,
    read_count INT DEFAULT 0,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT FALSE,
    recommended_by VARCHAR(255),
    recommended_reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_project_id (project_id),
    INDEX idx_user_id (user_id),
    INDEX idx_paper_id (paper_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_difficulty (difficulty),
    INDEX idx_relevance (relevance),
    INDEX idx_added_at (added_at),
    INDEX idx_reading_progress (reading_progress),
    INDEX idx_is_bookmarked (is_bookmarked),
    INDEX idx_is_recommended (is_recommended),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_paper_project (user_id, paper_id, project_id)
);
```

### Reading List Stats Table (Optional - for caching)

```sql
CREATE TABLE reading_list_stats (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    project_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    total_items INT DEFAULT 0,
    pending_items INT DEFAULT 0,
    in_progress_items INT DEFAULT 0,
    completed_items INT DEFAULT 0,
    skipped_items INT DEFAULT 0,
    total_estimated_time INT DEFAULT 0,
    total_actual_time INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    average_reading_time INT DEFAULT 0,
    most_read_author VARCHAR(255),
    most_read_venue VARCHAR(255),
    top_tags JSON, -- Array of tag strings
    reading_streak INT DEFAULT 0,
    last_activity DATETIME,
    calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_project_user (project_id, user_id),
    INDEX idx_calculated_at (calculated_at),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_project_user (project_id, user_id)
);
```

## API Endpoints

### 1. Get Reading List

**GET** `/api/v1/projects/{projectId}/reading-list`

Retrieve all reading list items for a project.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "paperId": "uuid",
      "paper": {
        "id": "uuid",
        "title": "Paper Title",
        "authors": [{"name": "Author Name"}],
        "venueName": "Conference/Journal Name",
        "publicationDate": "2023-01-01",
        "abstractText": "Abstract content...",
        "citationCount": 100,
        "isOpenAccess": true,
        "source": "arxiv"
      },
      "status": "pending",
      "priority": "high",
      "addedAt": "2023-12-01T10:00:00Z",
      "startedAt": null,
      "completedAt": null,
      "estimatedTime": 30,
      "actualTime": null,
      "notes": "Important paper for methodology",
      "tags": ["machine-learning", "deep-learning"],
      "rating": null,
      "difficulty": "medium",
      "relevance": "high",
      "readingProgress": 0,
      "lastReadAt": null,
      "readCount": 0,
      "isBookmarked": false,
      "isRecommended": false,
      "recommendedBy": null,
      "recommendedReason": null
    }
  ],
  "message": "Reading list retrieved successfully"
}
```

### 2. Add Paper to Reading List

**POST** `/api/v1/projects/{projectId}/reading-list`

Add a paper to the reading list.

**Request Body:**
```json
{
  "paperId": "uuid",
  "priority": "high",
  "estimatedTime": 30,
  "notes": "Important paper for methodology",
  "tags": ["machine-learning", "deep-learning"],
  "difficulty": "medium",
  "relevance": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "paperId": "uuid",
    "paper": { /* paper object */ },
    "status": "pending",
    "priority": "high",
    "addedAt": "2023-12-01T10:00:00Z",
    /* ... other fields */
  },
  "message": "Paper added to reading list successfully"
}
```

### 3. Update Reading List Item

**PUT** `/api/v1/projects/{projectId}/reading-list/{itemId}`

Update a reading list item.

**Request Body:**
```json
{
  "status": "in-progress",
  "priority": "critical",
  "estimatedTime": 45,
  "actualTime": 20,
  "notes": "Updated notes",
  "tags": ["updated-tag"],
  "rating": 4,
  "difficulty": "hard",
  "relevance": "critical",
  "readingProgress": 50,
  "isBookmarked": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    /* ... updated item */
  },
  "message": "Reading list item updated successfully"
}
```

### 4. Update Reading List Item Status

**PATCH** `/api/v1/projects/{projectId}/reading-list/{itemId}/status`

Update only the status of a reading list item.

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "startedAt": "2023-12-01T10:00:00Z",
    "completedAt": "2023-12-01T11:30:00Z"
  },
  "message": "Status updated successfully"
}
```

### 5. Update Reading Progress

**PATCH** `/api/v1/projects/{projectId}/reading-list/{itemId}/progress`

Update the reading progress percentage.

**Request Body:**
```json
{
  "readingProgress": 75
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "readingProgress": 75,
    "lastReadAt": "2023-12-01T11:30:00Z"
  },
  "message": "Reading progress updated successfully"
}
```

### 6. Remove from Reading List

**DELETE** `/api/v1/projects/{projectId}/reading-list/{itemId}`

Remove a paper from the reading list.

**Response:**
```json
{
  "success": true,
  "message": "Paper removed from reading list successfully"
}
```

### 7. Get Reading List Statistics

**GET** `/api/v1/projects/{projectId}/reading-list/stats`

Get comprehensive statistics about the reading list.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalItems": 25,
    "pendingItems": 10,
    "inProgressItems": 5,
    "completedItems": 8,
    "skippedItems": 2,
    "totalEstimatedTime": 750,
    "totalActualTime": 600,
    "averageRating": 4.2,
    "completionRate": 32.0,
    "averageReadingTime": 24,
    "mostReadAuthor": "John Smith",
    "mostReadVenue": "ICML",
    "topTags": ["machine-learning", "deep-learning", "neural-networks"],
    "readingStreak": 7,
    "lastActivity": "2023-12-01T11:30:00Z"
  },
  "message": "Reading list statistics retrieved successfully"
}
```

### 8. Get Reading List Recommendations

**GET** `/api/v1/projects/{projectId}/reading-list/recommendations?limit=10`

Get personalized paper recommendations.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "paperId": "uuid",
      "paper": { /* paper object */ },
      "isRecommended": true,
      "recommendedBy": "ai-system",
      "recommendedReason": "Based on your reading history and project topics",
      "relevance": "high",
      "difficulty": "medium"
    }
  ],
  "message": "Recommendations retrieved successfully"
}
```

### 9. Add Note to Reading List Item

**POST** `/api/v1/projects/{projectId}/reading-list/{itemId}/notes`

Add or update notes for a reading list item.

**Request Body:**
```json
{
  "note": "Important insights from this paper..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "notes": "Important insights from this paper..."
  },
  "message": "Note added successfully"
}
```

### 10. Rate Reading List Item

**PATCH** `/api/v1/projects/{projectId}/reading-list/{itemId}/rating`

Rate a reading list item (1-5 stars).

**Request Body:**
```json
{
  "rating": 4
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "rating": 4
  },
  "message": "Rating updated successfully"
}
```

### 11. Toggle Bookmark

**PUT** `/api/v1/projects/{projectId}/reading-list/{itemId}/bookmark`

Toggle the bookmark status of a reading list item.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isBookmarked": true
  },
  "message": "Bookmark toggled successfully"
}
```

### 12. Bulk Update Reading List

**PATCH** `/api/v1/projects/{projectId}/reading-list/bulk`

Update multiple reading list items at once.

**Request Body:**
```json
{
  "updates": [
    {
      "itemId": "uuid1",
      "updates": {
        "status": "completed",
        "rating": 5
      }
    },
    {
      "itemId": "uuid2",
      "updates": {
        "priority": "high"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    { /* updated item 1 */ },
    { /* updated item 2 */ }
  ],
  "message": "Bulk update completed successfully"
}
```

## Business Logic Requirements

### 1. Status Management
- When status changes to 'in-progress', set `startedAt` timestamp
- When status changes to 'completed', set `completedAt` timestamp
- When status changes from 'completed' to other, clear `completedAt`
- When status changes to 'in-progress', increment `readCount`

### 2. Progress Tracking
- `readingProgress` must be between 0-100
- When `readingProgress` reaches 100, automatically set status to 'completed'
- Update `lastReadAt` whenever progress is updated

### 3. Time Tracking
- `estimatedTime` and `actualTime` are in minutes
- When status changes to 'completed', calculate actual time if not provided
- Update average reading time statistics

### 4. Rating System
- Rating must be between 1-5
- Calculate average rating for statistics
- Only allow rating for completed items

### 5. Recommendation System
- Generate recommendations based on:
  - User's reading history
  - Project topics and tags
  - Paper citations and relevance
  - User's preferred difficulty level
  - Similar papers in the project

### 6. Statistics Calculation
- Calculate completion rate: (completed + skipped) / total * 100
- Calculate reading streak based on daily activity
- Track most read authors and venues
- Generate top tags from all items

## Security Requirements

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own reading lists
3. **Input Validation**: Validate all input data and sanitize for XSS
4. **Rate Limiting**: Limit bulk operations to prevent abuse
5. **Audit Logging**: Log all status changes and progress updates

## Performance Optimizations

1. **Database Indexes**: Index on frequently queried fields
2. **Caching**: Cache statistics and recommendations
3. **Pagination**: Support pagination for large reading lists
4. **Eager Loading**: Load paper data efficiently
5. **Background Jobs**: Calculate statistics asynchronously

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": {
    "field": "rating",
    "issue": "Rating must be between 1 and 5"
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Reading list item not found"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "You don't have permission to access this reading list"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "error": "DUPLICATE_ENTRY",
  "message": "Paper already exists in reading list"
}
```

## Implementation Notes

1. **Database Transactions**: Use transactions for bulk operations
2. **Soft Deletes**: Consider soft deletes for audit trail
3. **Data Consistency**: Ensure paper references remain valid
4. **Performance Monitoring**: Monitor query performance and optimize
5. **Backup Strategy**: Regular backups of reading list data
6. **Migration Scripts**: Provide migration scripts for schema changes

## Testing Requirements

1. **Unit Tests**: Test all business logic functions
2. **Integration Tests**: Test API endpoints with database
3. **Performance Tests**: Test with large datasets
4. **Security Tests**: Test authentication and authorization
5. **Edge Cases**: Test boundary conditions and error scenarios 