# Getting started - Initial setup

#### 1. Create a NestJs App `npm i use-generated-cli` and `npx use-generated new project_name`, 

#### 2. Install dependencies: `cd project_name` and `npm i`.

#### 3. Add the .env file to include DATABASE_URL and if the auth module is included add SALT, JWT_SECRET

# Developing workflow

#### 1. Define your models in `prisma/schema.prisma`.

Please make sure you have a postgres database created and it matches `.env` config for more info please consult Prisma docs[https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema]).


#### 2. Create and apply prisma migrations `npx prisma migrate dev`. 

This will also regenerate prisma client and the NestJs GraphQL types in the `src/@generated` folder based on the generator.


#### 3. Define your api in `use-generated-config/appconfig.json`.

You could use the config from `use-generated-config/appconfig_example.json` along with copying the contents of `use-generated-config/schema.prisma__example` to `prisma/schema.prisma` as a working starting point. Also if auth module is used make sure you have `SALT` and `JWT_SECRET` in `.env` defined  as per `.env__example`

Optionally, run `npx use-generated generate config` to generate a starting point in your appconfig.json


### 4. Run `npx use-generated api` to generate the api  


### 5. Run `npm run start:dev` to start the development server



# GraphQL API and props
With this CLI you will be able to create a fully customizable and extendable Graphql CRUD API just by defining the  database or **data models** and a **configuration file**


## Resolvers

1. `allUsers`- accepts properties:
  - `perPage`- used for pagination
  - `skip`- used for pagination
  - `orderBy` sorting / ordering, matches the Prisma ORM `orderBy` API
  - `where` filtering matches the Prisma ORM `where`
  - `nestedArgs` defines the `perPage`, `skip`,`orderBy` and `where` for the nested relations

Example:
query:
```graphql
query users($nestedArgs:UserNestedArgsStartPoint,$where:UserWhereInput) {
  allUsers(where:$where,nestedArgs:$nestedArgs){
    id
    email
    comments {
      id
      content
      likes {
        id
        userId
      }
    }
  }
}

```
variables:
```graphql
{
  "where": {"email": {"equals": "second@email.com"}}
  "nestedArgs": {
    "comments": {
      "args": {
        "where": {"id": {"gte": 2 }}
      },
      "likes":{
        "args": {
          "where": {"userId": {"gte": 10 }}
        },
      }

    }
  }
}
```
results:
```graphql
{
  "data": {
    # allUsers results is filtered by where
    "allUsers": [
      {
        "id": "2",
        "email": "second@email.com",
        # comments list is filtered by 'nestedArgs.comments.args.where' property
        "comments": [ 
          {
            "id": "2",
            "content": "hey there is the second comment"
            # likes list is filtered by nestedArgs.comments.likes.args.where property
            "likes": [
              {
                "id": "2",
                "userId":"10"
              },
              {
                "id": "2",
                "userId":"11"
              }
            ]
          },
          {
            "id": "3",
            "content": "Here is the third comment",
            "likes": [
              {
                "id": "2",
                "userId":"12"
              }
            ]
          }
        ]
      }
    ]
  }
}
```


2. `User` -get one user by id accepts properties:
  - `id`
  - `nestedArgs` same as for `allUsers` defines the `perPage`, `skip`,`orderBy` and `where` for the nested relations
Example 
query
```graphql
query users($nestedArgs:UserNestedArgsStartPoint,$id:Int!) {
  User(id:$id,nestedArgs:$nestedArgs){
    id
    email
    comments {
      id
      content
    }
  }
}
```
Variables:
```graphql
{
  "nestedArgs": {
    "comments": {
      "args": {"where": {"id": {"gte": 2 }}}
    }
  },
  "id": 1
}
}
```
Results:
```graphql
{
  "data": {
    "User": {
      "id": "1",
      "email": "firstuseremail",
      "comments": [
        {
          "id": "3",
          "content": "hey there third comment"
        }
      ]
    }
  }
}
```


3. `_allUsersMeta`- count


## Muations
generated mutations based on the default templates
Considering a model called `User`:
`createUser`, `updateUser`, `deleteUser`,`updateManyUsers`

# Defining the data structure with Prisma ORM
For full documentation please check https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-postgres


Here is a sample schema.prisma file where the data models are defined

```prisma

generator client {
  provider = "prisma-client-js"
}

// connection to the a postgress database. make sure there is a  DATABASE_URL variable in the .env file
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator nestgraphql {
  provider           = "node node_modules/prisma-nestjs-graphql"
  noAtomicOperations = "true"
  reExport           = "Directories"
  output             = "../src/@generated"
}

model User {
  id           Int        @id @default(autoincrement())
  email        String     @unique
  passwordHash String?    @unique
  resetToken   String?    @unique
  roles        UserRole[]
  // The foreign key from the Post.author is defined here as well explicit, if not defined there will be an error
  posts        Post[]


}

enum UserRole {
  SuperAdmin
  Admin
}

model Post {
  id        Int       @id @default(autoincrement())
  title     String
  content   String?
  published Boolean
  // defines a foreign key to the User, the property on this object will be called author and the id of the relation "authorId" while the target connection field on the User is "id"
  author    User?     @relation(fields: [authorId], references: [id])
  authorId  Int?
}
```


# Understanding appconfig.json
The Graphql API is generated based on the `schema.prisma` file and `appconfig.json` configuration file

## `modules` 
Defines the folders in wich the models will be structured
- `name` - name of the folder
- `models` -nest js models 

### `models` 
- `name` - name of the module
- `queryDepthLevel`- number, defining the depth level that relations can be interogated, it will override the `defaultQueryDepthLevel` from the root level. please keep in mind that setting a high number here will cause performance issues: for each relation there will be one query to the db.
Example:
- `queryDepthStructure` defines the structure of the relations that can be interogated 
Example:
- `requireLogin` 
  1. If `true` all mutations and queries will require login. It will override the `defaultRequireLogin` from the root level.
  2.  If it's an array of strings it defines the list of queries and mutations for which login will be required
  `"requireLogin": [ "findAll", "create"]`

- `requiredRoles` 
  1. If it's an array of strings- it defines a list of roles that if a user has at least one can perform a query or a mutation for the model
  2. if it's an object should have the properties corresponding to the name of the queries and mutations 
  {
    "findAll":["Admin"],
    "createItem":["SuperAdmin"]
  } 
  Warning if one query of mutation is excluded in this object there will be no role applied, and if require login doesn't cover that mutation or query it will be left open without any authentication.
- `crud` - allows to define `resolverTemplate` and `serviceTemplate` for this model. We recommend using the default ones as a starting point. Incorrect templates could cause properties above to not function as intended or even errors. pleasse see the templates section for more details


## `defaultRequireLogin` 
If `true` all mutations and queries will require login unless there requireLogin is defined at model level. In that case the model level definition is applied.

## `createAuthModule` 
If `true` and a module called 'auth' doesn't exist at the root level, the default auth module that comes with this package will be copied over, if the folder already exists with the name 'auth' nothing will happen

## `defaultQueryDepthLevel` 
 The depth level that relations can be interogated, if `ueryDepthLevel` is defined at the module level this prop will be ignored
 
## `createPrismaModule`
If `true` and a module called 'prisma' doesn't exist at the root level, the default prisma module that comes with this package will be copied over, if the folder already exists with the name 'prisma'  nothing will happen


## `createCommonTypes`
If `true` it creates a folder called `commonTypes` at the root level containing `ListMetadata`



# Extending the Graphql API 

The generated resolvers and services are under {modelNameHere}/generated
Like so `user/generated/user.generated-resolver.ts`, `user/generated/user.generated-service`
For overriding a method in service just add the modified method in `user/user.generated-service.ts` that has the **same name** as one in the generated file. No need to delete the one from generated file.


# "src/@generated" folder
It's generated by the "prisma-nestjs-graphql" module, based on the definitions in schema.prisma
```
generator nestgraphql {
  provider           = "node node_modules/prisma-nestjs-graphql"
  noAtomicOperations = "true"
  reExport           = "Directories"
  output             = "../src/@generated"
}
``` 
It's recreated anytime prisma client is generated (`yarn prisma generate`)
Contains GraphQL all the standard type definitions.