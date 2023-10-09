import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { v1 as uuid } from 'uuid'
import { GraphQLError } from 'graphql'

const persons = [
    {
        name: "Dario",
        phone: "345343434",
        street: "Calle Backend",
        city: "Barcelona",
        id: "123123"
    },
    {
        name: "Carlos",
        phone: "789898989",
        street: "Calle Frontend",
        city: "Barcelona",
        id: "456456"
    },
    {
        name: "Alex",
        phone: "567565656",
        street: "Calle Java",
        city: "Barcelona",
        id: "789789"
    }
    
]



const typeDefinitions = `#graphql
    enum YesNo {
        YES 
        NO 
    }

    # enum Status {
    #     COMPLETED
    #     WIP
    # }

    type Address {
        street: String!
        city: String!
    }

    type Person {
        name: String!
        phone: String
        address: Address!
        id: ID!
        check: String!
    }

    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person!]!
        findPerson(name: String!): Person
    }

    type Mutation {
        addPerson(
            name: String!
            phone: String
            street: String!
            city: String!
    ): Person

        editNumber(
            name: String!
            phone: String!
        ): Person
    }

`

const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: (root, args) => {
            if (!args.phone) {
                return persons
            }

            const byPhone = (person) => args.phone === 'YES' ? person.phone : !person.phone
            return persons.filter(byPhone)
        },

        findPerson: (root, args) => {
            const {name} = args
            return persons.find(person => person.name === name)
        },
        
    },

    Mutation: {
        addPerson: (root, args) => {
            if (persons.find(person => person.name === args.name)) {
                throw new GraphQLError('Name must be unique', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                        exception: {
                            invalidArgs: args.name,
                        },
                    },
                })
                
            }
            // const {name, phone, street, city} = args
            const person = {...args, id: uuid()}
            persons.push(person) //update database
            return person
        },

        editNumber: (root, args) => {
            const personIndex = persons.findIndex(person => person.name === args.name) //find index of person
            if(personIndex === -1) return null
            
            const person = persons[personIndex]

            const updatedPerson = {...person, phone: args.phone}
            persons[personIndex] = updatedPerson //update database

            return updatedPerson

        }
    },

    Person: {
        check: (root) => "Checked",
        
        address: (root) => {
            return {
                street: root.street,
                city: root.city
            }
        }
        
    }
}

const server = new ApolloServer({
    typeDefs: typeDefinitions,
    resolvers,
})

const { url } = await startStandaloneServer(server, {
    listen: {port: 4001},
})
console.log(`Server ready at ${url}`)

