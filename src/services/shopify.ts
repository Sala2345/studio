/**
 * @fileOverview Service for interacting with the Shopify Admin API.
 */

export async function getProducts(query: string) {
  const storeUrl = process.env.SHOPIFY_STORE_URL;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!storeUrl || !accessToken) {
    throw new Error('Shopify store URL or access token is not configured.');
  }

  // A more specific GraphQL query might be better here depending on the use case.
  // This is a general-purpose query to get basic product info.
  const graphqlQuery = {
    query: `
      query getProducts($query: String) {
        products(first: 10, query: $query) {
          edges {
            node {
              id
              title
              description
              handle
              tags
              totalInventory
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `,
    variables: { query },
  };

  try {
    const response = await fetch(`https://${storeUrl}/admin/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify(graphqlQuery),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Shopify API request failed:', response.status, errorBody);
        throw new Error(`Shopify API request failed with status ${response.status}`);
    }

    const jsonResponse = await response.json();
    if(jsonResponse.errors) {
        console.error('GraphQL errors:', jsonResponse.errors);
        throw new Error('Error executing GraphQL query.');
    }

    return jsonResponse.data?.products?.edges.map((edge: any) => edge.node) || [];
  } catch (error) {
    console.error('Failed to fetch from Shopify:', error);
    // It's often better to return a friendly error message or an empty array
    // to the AI rather than throwing an exception.
    return { error: 'Failed to fetch product data from Shopify.' };
  }
}
