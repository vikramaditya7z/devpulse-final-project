const {
  validateRepoIdentifier,
  GitHubApiError,
  getRepoMetadata,
  clearCache
} = require('../services/githubService');

describe('GitHub Service - Validation and Error Handling', () => {
  beforeEach(() => {
    clearCache();
    jest.restoreAllMocks();
  });

  describe('validateRepoIdentifier', () => {
    test('accepts valid GitHub owners and repository names', () => {
      const valid1 = validateRepoIdentifier('facebook', 'react');
      expect(valid1).toEqual({ owner: 'facebook', repo: 'react' });

      const valid2 = validateRepoIdentifier('octo-cat', 'my_repo.v1');
      expect(valid2).toEqual({ owner: 'octo-cat', repo: 'my_repo.v1' });
    });

    test('rejects empty or whitespace-only inputs', () => {
      expect(() => validateRepoIdentifier('', 'repo')).toThrow(GitHubApiError);
      expect(() => validateRepoIdentifier('owner', '   ')).toThrow(GitHubApiError);
    });

    test('rejects malformed owners or repository names with illegal characters', () => {
      expect(() => validateRepoIdentifier('-invalidOwner', 'repo')).toThrow('Invalid repository owner format');
      expect(() => validateRepoIdentifier('owner', 'repo/with/slash')).toThrow('Invalid repository name format');
      expect(() => validateRepoIdentifier('owner', 'repo$name')).toThrow('Invalid repository name format');
    });
  });

  describe('fetchFromGitHub handling via getRepoMetadata', () => {
    test('handles 404 Not Found cleanly with REPO_NOT_FOUND code', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({
          'x-ratelimit-remaining': '50',
          'x-ratelimit-reset': '1700000000'
        })
      });

      await expect(getRepoMetadata('nonexistent', 'project')).rejects.toMatchObject({
        name: 'GitHubApiError',
        statusCode: 404,
        code: 'REPO_NOT_FOUND'
      });
    });

    test('handles 403 Rate Limit cleanly with RATE_LIMIT_EXCEEDED code', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1800000000'
        })
      });

      await expect(getRepoMetadata('octocat', 'hello-world')).rejects.toMatchObject({
        name: 'GitHubApiError',
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    });

    test('rejects private repositories as not supported in V1', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'x-ratelimit-remaining': '50'
        }),
        json: async () => ({
          name: 'secret-repo',
          full_name: 'org/secret-repo',
          owner: { login: 'org' },
          private: true
        })
      });

      await expect(getRepoMetadata('org', 'secret-repo')).rejects.toMatchObject({
        name: 'GitHubApiError',
        statusCode: 400,
        code: 'PRIVATE_REPO_NOT_SUPPORTED'
      });
    });
  });
});
