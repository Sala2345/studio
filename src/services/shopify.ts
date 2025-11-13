/**
 * @fileOverview Service for interacting with the Shopify Admin API.
 */

async function shopifyFetch(graphqlQuery: { query: string; variables?: object }) {
  const storeUrl = process.env.SHOPIFY_STORE_URL;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!storeUrl || !accessToken) {
    throw new Error('Shopify store URL or access token is not configured.');
  }

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
        // Return a structured error so the AI can potentially understand it.
        return { error: 'Error executing GraphQL query.', details: jsonResponse.errors };
    }

    return jsonResponse.data;
  } catch (error) {
    console.error('Failed to fetch from Shopify:', error);
    return { error: 'Failed to fetch data from Shopify.' };
  }
}

export async function getProducts(query?: string) {
  const graphqlQuery = {
    query: `
      query getProducts($query: String) {
        products(first: 25, query: $query) {
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
              variants(first: 1) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      }
    `,
    variables: { query },
  };

  const data = await shopifyFetch(graphqlQuery);
  return data?.products?.edges.map((edge: any) => edge.node) || data;
}


export async function createPage(title: string, bodyHtml: string) {
    const graphqlQuery = {
      query: `
        mutation pageCreate($input: PageCreateInput!) {
          pageCreate(input: $input) {
            page {
              id
              title
              handle
              url
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        input: {
          title,
          bodyHtml,
        },
      },
    };
  
    return shopifyFetch(graphqlQuery);
}

export async function updateProduct(productId: string, productInput: any) {
    const graphqlQuery = {
        query: `
            mutation productUpdate($input: ProductInput!) {
                productUpdate(input: $input) {
                    product {
                        id
                        title
                        bodyHtml
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `,
        variables: {
            input: {
                id: productId,
                ...productInput
            }
        }
    };
    return shopifyFetch(graphqlQuery);
}


export async function createDraftOrder(customerId: string, variantId: string, customAttributes: {key: string, value: string}[]) {
  const graphqlQuery = {
    query: `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            invoiceUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: {
      input: {
        customerId: `gid://shopify/Customer/${customerId}`,
        lineItems: [{
          variantId: variantId,
          quantity: 1
        }],
        customAttributes: customAttributes
      }
    }
  };
  return shopifyFetch(graphqlQuery);
}
