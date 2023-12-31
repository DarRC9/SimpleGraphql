import { ApolloServer} from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { v1 as uuid } from 'uuid';
import { GraphQLError } from 'graphql';

interface Person {
  name: string;
  phone?: string;
  street: string;
  city: string;
  id: string;
}

const persons: Person[] = [
  {
    name: "Dario",
    phone: "345343434",
    street: "Calle Backend",
    city: "Barcelona",
    id: "123123",
  },
  {
    name: "Carlos",
    phone: "789898989",
    street: "Calle Frontend",
    city: "Barcelona",
    id: "456456",
  },
  {
    name: "Alex",
    street: "Calle Java",
    city: "Barcelona",
    id: "789789",
  }
];

const typeDefs = `#graphql
  
  type Address {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID!
  }

  enum YesNo {
    YES 
    NO 
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
`;

const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: (_root: any, args: { phone?: string }) => {
      if (!args.phone) {
        return persons;
      }

      const byPhone = (person: Person) => {
        if (args.phone === 'YES') {
          return person.phone; // person.phone means that the field phone has to exist 
        } else {
          return !person.phone; // !person.phone means that the field phone does not exist (null)
        }
      };        
      return persons.filter(byPhone);
    },

    findPerson: (_root: any, args: { name: string }) => {
      const { name } = args;
      return persons.find(person => person.name === name);
    },
  },

  Mutation: {
    addPerson: (_root: any, args: Person) => {
      if (persons.find(person => person.name === args.name)) {
        throw new GraphQLError('Name must be unique', {
          extensions: {
            code: 'BAD_USER_INPUT',
            exception: {
              invalidArgs: args.name,
            },
          },
        });
      }
      
      const person = { ...args, id: uuid()};
      persons.push(person);
      return person;
    },

    editNumber: (_root: any, args: { name: string, phone: string }) => {
      const personIndex = persons.findIndex(person => person.name === args.name);
      if (personIndex === -1) return null;

      const person = persons[personIndex];
      const updatedPerson = { ...person, phone: args.phone };
      persons[personIndex] = updatedPerson;
      return updatedPerson;
    }
  },

  Person: {
    address: (root: Person) => {
      return {
        street: root.street,
        city: root.city
      };
    }
    //name: (root: Person) => `${root.name}, ${root.phone}`,
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4001 },
  });
  console.log(`Server ready at ${url}`);
}

startServer();
