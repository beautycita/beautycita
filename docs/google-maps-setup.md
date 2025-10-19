# Google Maps API Setup Guide

## Overview
BeautyCita uses Google Maps JavaScript API for stylist location selection during registration. This guide covers the setup process.

## Required Google Cloud APIs

### 1. Maps JavaScript API
- **Purpose**: Displays interactive maps in the location picker
- **Usage**: Allows stylists to visualize and select their business location
- **Required for**: Map display, marker placement, map interactions

### 2. Places API
- **Purpose**: Address autocomplete and place details
- **Usage**: Search and autocomplete business addresses
- **Required for**: Address suggestions, place details, location validation

### 3. Geocoding API
- **Purpose**: Convert addresses to coordinates and vice versa
- **Usage**: Reverse geocoding when marker is dragged
- **Required for**: Address-to-coordinates conversion

## Setup Steps

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable billing (required for Maps API)
4. Go to "APIs & Services" > "Library"
5. Search for and enable each required API:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### 2. API Key Creation
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. **Important**: Immediately restrict the API key (see security section)

### 3. API Key Restrictions (Security)
1. Click on the API key to edit restrictions
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add authorized domains:
     - `https://beautycita.com/*`
     - `https://www.beautycita.com/*`
     - `http://localhost:*` (for development)
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose the three APIs listed above

### 4. Environment Configuration
Replace the placeholder in `/frontend/.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

## Cost Optimization

### Free Tier Limits
- **Maps JavaScript API**: $200 credit/month (28,000 map loads)
- **Places API**: $200 credit/month (17,000 requests)
- **Geocoding API**: $200 credit/month (40,000 requests)

### Usage Estimates
- **Expected Usage**: ~500 stylist registrations/month
- **Map loads**: ~500/month (well within free tier)
- **Places API calls**: ~2,000/month (address searches)
- **Geocoding calls**: ~1,000/month (marker drags)

**Total estimated cost**: $0/month (within free tier)

## Testing

### Development Testing
1. Update the API key in `.env`
2. Restart the development server
3. Navigate to stylist registration (step 3)
4. Verify:
   - Map loads correctly
   - Address search works
   - Marker can be dragged
   - Address updates when marker moves

### Production Testing
1. Test with domain restrictions enabled
2. Verify API key works on production domain
3. Monitor API usage in Google Cloud Console

## Troubleshooting

### Common Issues

**Map doesn't load:**
- Check API key is correct
- Verify Maps JavaScript API is enabled
- Check browser console for errors
- Ensure domain is whitelisted in restrictions

**Address search doesn't work:**
- Verify Places API is enabled
- Check API key restrictions include Places API
- Monitor API quota usage

**Reverse geocoding fails:**
- Verify Geocoding API is enabled
- Check for quota limits
- Ensure proper error handling

### Error Codes
- `OVER_QUERY_LIMIT`: Exceeded API quota
- `REQUEST_DENIED`: API key invalid or restricted
- `ZERO_RESULTS`: No results for location
- `INVALID_REQUEST`: Malformed request

## Monitoring
- Set up billing alerts in Google Cloud Console
- Monitor API usage regularly
- Set quotas to prevent unexpected charges
- Review API logs for errors

## Security Best Practices
1. **Never commit API keys to version control**
2. **Always use domain restrictions**
3. **Monitor usage regularly**
4. **Rotate API keys periodically**
5. **Use separate keys for dev/staging/production**

## Support
- Google Maps Platform Documentation: https://developers.google.com/maps
- Google Cloud Support: Available with billing account
- Community Forums: Stack Overflow (google-maps tag)