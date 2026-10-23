const request = require('supertest');
const app = require('../app');
const SavedRepository = require('../models/SavedRepository');
const githubService = require('../services/githubService');
const { generateToken } = require('../utils/jwt');

describe('Saved Repositories API & Authorization Tests', () => {
  const user1Id = '507f1f77bcf86cd799439011';
  const user2Id = '507f1f77bcf86cd799439022';
  const user1Token = generateToken({ id: user1Id, email: 'user1@university.edu' });
  const user2Token = generateToken({ id: user2Id, email: 'user2@university.edu' });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/repos', () => {
    test('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/repos').send({ owner: 'facebook', repo: 'react' });
      expect(res.status).toBe(401);
    });

    test('saves a legitimate public repo and rejects duplicate saves by the same user', async () => {
      jest.spyOn(githubService, 'getRepoMetadata').mockResolvedValue({
        owner: 'facebook',
        repo: 'react',
        fullName: 'facebook/react',
        url: 'https://github.com/facebook/react',
        description: 'The library for web and native user interfaces.',
        stars: 220000,
        forks: 45000,
        openIssuesCount: 1200,
        defaultBranch: 'main'
      });

      // 1. First save succeeds (no duplicate found)
      jest.spyOn(SavedRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(SavedRepository, 'create').mockResolvedValueOnce({
        _id: '607f1f77bcf86cd799439033',
        user: user1Id,
        owner: 'facebook',
        repo: 'react',
        fullName: 'facebook/react'
      });

      const res1 = await request(app)
        .post('/api/repos')
        .set('Cookie', [`token=${user1Token}`])
        .send({ owner: 'facebook', repo: 'react' });

      expect(res1.status).toBe(201);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data.repository.fullName).toBe('facebook/react');

      // 2. Duplicate save by same user fails with 409 Conflict
      jest.spyOn(SavedRepository, 'findOne').mockResolvedValueOnce({
        _id: '607f1f77bcf86cd799439033',
        fullName: 'facebook/react'
      });

      const resDuplicate = await request(app)
        .post('/api/repos')
        .set('Cookie', [`token=${user1Token}`])
        .send({ owner: 'facebook', repo: 'react' });

      expect(resDuplicate.status).toBe(409);
      expect(resDuplicate.body.error.code).toBe('REPO_ALREADY_SAVED');
    });

    test('rejects saving a non-existent repo on GitHub with 404', async () => {
      const { GitHubApiError } = require('../services/githubService');
      jest.spyOn(githubService, 'getRepoMetadata').mockRejectedValue(
        new GitHubApiError('Public repository not found on GitHub.', 404, 'REPO_NOT_FOUND')
      );

      const res = await request(app)
        .post('/api/repos')
        .set('Cookie', [`token=${user1Token}`])
        .send({ owner: 'fake-owner-1234', repo: 'fake-repo-5678' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REPO_NOT_FOUND');
    });
  });

  describe('GET /api/repos', () => {
    test('strictly isolates saved repositories by user', async () => {
      const user1Repos = [
        {
          _id: '607f1f77bcf86cd799439033',
          user: user1Id,
          fullName: 'facebook/react'
        }
      ];

      const sortMock = jest.fn().mockResolvedValue(user1Repos);
      jest.spyOn(SavedRepository, 'find').mockImplementation((query) => {
        expect(query.user).toBe(user1Id); // Invariant: queries strictly by user ID
        return { sort: sortMock };
      });

      const res = await request(app)
        .get('/api/repos')
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.repositories.length).toBe(1);
      expect(res.body.data.repositories[0].fullName).toBe('facebook/react');
    });
  });

  describe('DELETE /api/repos/:id', () => {
    test('prevents User 2 from deleting User 1 saved repository', async () => {
      const repoId = '607f1f77bcf86cd799439033';

      // findOneAndDelete with user: user2Id returns null because it is owned by user1Id
      jest.spyOn(SavedRepository, 'findOneAndDelete').mockResolvedValue(null);
      // findById returns the repo owned by someone else
      jest.spyOn(SavedRepository, 'findById').mockResolvedValue({
        _id: repoId,
        user: user1Id
      });

      const unauthorizedDelete = await request(app)
        .delete(`/api/repos/${repoId}`)
        .set('Cookie', [`token=${user2Token}`]);

      expect(unauthorizedDelete.status).toBe(403);
      expect(unauthorizedDelete.body.error.code).toBe('FORBIDDEN');

      // User 1 successfully deletes own repo
      jest.spyOn(SavedRepository, 'findOneAndDelete').mockResolvedValue({
        _id: repoId,
        fullName: 'angular/angular'
      });

      const authorizedDelete = await request(app)
        .delete(`/api/repos/${repoId}`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(authorizedDelete.status).toBe(200);
      expect(authorizedDelete.body.success).toBe(true);
    });
  });

  describe('GET /api/repos/:id/health', () => {
    test('retrieves health metrics and bottlenecks for a saved repo', async () => {
      const repoId = '607f1f77bcf86cd799439033';
      const mockSavedRepo = {
        _id: repoId,
        user: user1Id,
        owner: 'facebook',
        repo: 'react',
        fullName: 'facebook/react',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(SavedRepository, 'findOne').mockResolvedValue(mockSavedRepo);

      jest.spyOn(githubService, 'getRawRepoData').mockResolvedValue({
        metadata: {
          owner: 'facebook',
          repo: 'react',
          fullName: 'facebook/react',
          description: 'The React library',
          stars: 220000,
          forks: 45000,
          defaultBranch: 'main',
          url: 'https://github.com/facebook/react'
        },
        issues: [
          {
            number: 1,
            title: 'Very old issue',
            html_url: 'https://github.com/facebook/react/issues/1',
            created_at: '2026-08-01T00:00:00.000Z',
            updated_at: '2026-08-01T00:00:00.000Z'
          }
        ],
        openPullRequests: [],
        closedPullRequests: [
          {
            number: 10,
            created_at: '2026-10-20T00:00:00.000Z',
            merged_at: '2026-10-21T00:00:00.000Z'
          }
        ],
        recentCommits: [{ sha: 'c1' }, { sha: 'c2' }]
      });

      const res = await request(app)
        .get(`/api/repos/${repoId}/health`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.analysis).toBeDefined();
      expect(res.body.data.analysis.metrics.openIssuesCount).toBe(1);
      expect(res.body.data.analysis.metrics.mergedPullRequestsCount).toBe(1);
      expect(res.body.data.analysis.findings.length).toBeGreaterThan(0);
      expect(res.body.data.analysis.findings[0].type).toBe('stale_issue');
    });
  });
});
