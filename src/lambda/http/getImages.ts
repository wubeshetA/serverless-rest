import {APIGatewayProxyHandler,
    APIGatewayProxyEvent,
    APIGatewayProxyResult} from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'


const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.IMAGES_TABLE
const imagesTable = process.env.IMAGES_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)

    const groupId = event.pathParameters.groupId

    const validGroupId = await groupExists(groupId)

    if (!validGroupId) {
        return {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: ''
        }
    }

    const images = await getImages(groupId)

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
            items: images
        })

}

// Check if the group with the given group id is present in the 
// groups table
async function groupExists(groupId: string) {
    const result = await docClient
        .get({
            TableName: groupsTable,
            Key: {
                id: groupId
            }
        })
        .promise()

    console.log('Get group: ', result)
    return !!result.Item
}

// Get all images for the given group id
async function getImages(groupId: string) {
    const result = await docClient
        .query({
            TableName: imagesTable,
            KeyConditionExpression: 'groupId = :groupId',
            ExpressionAttributeValues: {
                ':groupId': groupId
            },
            ScanIndexForward: false
        })
        .promise()

    const items = result.Items
    return items
}

}