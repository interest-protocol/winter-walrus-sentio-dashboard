interface TypeMapping {
  [key: string]: string;
}

// Mapeamento de tipos do Move para TypeScript
const TYPE_MAPPINGS: TypeMapping = {
  'Address': 'string',
  'Bool': 'boolean',
  'U8': 'number',
  'U32': 'number',
  'U64': 'bigint | number',
  'U128': 'bigint',
  'String': 'string',
  'TypeName': 'string', // Suposição que TypeName é serializado como string
  'Url': 'string',
  'ID': 'string',
  'UID': 'string'
};

function generateEventInterfaces(jsonData: any): string {
  const eventsModule = jsonData.blizzard_events;
  if (!eventsModule || !eventsModule.structs) return '';

  let output = '// Interfaces geradas automaticamente a partir do JSON\n\n';
  
  // Primeiro processamos todas as structs para poder referenciar tipos customizados
  const customTypes: Set<string> = new Set();
  
  for (const structName of Object.keys(eventsModule.structs)) {
    const structData = eventsModule.structs[structName];
    if (structData.abilities?.abilities?.includes('Copy') && 
        structData.abilities?.abilities?.includes('Drop')) {
      customTypes.add(structName);
    }
  }

  // Agora geramos as interfaces
  for (const [structName, structData] of Object.entries(eventsModule.structs)) {
    if (!(structData.abilities?.abilities?.includes('Copy') && 
          structData.abilities?.abilities?.includes('Drop'))) continue;

    output += `export interface ${structName} {\n`;
    
    for (const field of structData.fields || []) {
      const tsType = mapMoveTypeToTS(field.type, customTypes);
      output += `  ${field.name}: ${tsType};\n`;
    }
    
    output += '}\n\n';
  }

  return output;
}

function mapMoveTypeToTS(moveType: any, customTypes: Set<string>): string {
  if (typeof moveType === 'string') {
    return TYPE_MAPPINGS[moveType] || moveType;
  }

  if (typeof moveType === 'object') {
    if (moveType.Struct) {
      const structName = moveType.Struct.name;
      return customTypes.has(structName) ? structName : TYPE_MAPPINGS[structName] || structName;
    }
    if (moveType.Vector) {
      const itemType = typeof moveType.Vector === 'string' ? 
        moveType.Vector : 
        moveType.Vector.Struct?.name || 'unknown';
      return `Array<${mapMoveTypeToTS(itemType, customTypes)}>`;
    }
    if (moveType.Reference) {
      return mapMoveTypeToTS(moveType.Reference, customTypes);
    }
    if (moveType.MutableReference) {
      return mapMoveTypeToTS(moveType.MutableReference, customTypes);
    }
    if (moveType.TypeParameter) {
      return `T${moveType.TypeParameter}`; // Genérico
    }
  }

  return 'any';
}

// Uso:
const jsonData = {
  "blizzard": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard",
    "friends": [],
    "structs": {
      "BLIZZARD": {
        "abilities": {
          "abilities": [
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "dummy_field",
            "type": "Bool"
          }
        ]
      }
    },
    "exposedFunctions": {}
  },
  "blizzard_acl": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_acl",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      }
    ],
    "structs": {
      "AdminWitness": {
        "abilities": {
          "abilities": [
            "Drop"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": []
            },
            "isPhantom": true
          }
        ],
        "fields": [
          {
            "name": "dummy_field",
            "type": "Bool"
          }
        ]
      },
      "BlizzardACL": {
        "abilities": {
          "abilities": [
            "Key"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": []
            },
            "isPhantom": true
          }
        ],
        "fields": [
          {
            "name": "id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "UID",
                "typeArguments": []
              }
            }
          },
          {
            "name": "admins",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "vec_set",
                "name": "VecSet",
                "typeArguments": [
                  "Address"
                ]
              }
            }
          }
        ]
      },
      "BlizzardAdmin": {
        "abilities": {
          "abilities": [
            "Store",
            "Key"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": []
            },
            "isPhantom": true
          }
        ],
        "fields": [
          {
            "name": "id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "UID",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "BlizzardSuperAdmin": {
        "abilities": {
          "abilities": [
            "Key"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": []
            },
            "isPhantom": true
          }
        ],
        "fields": [
          {
            "name": "id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "UID",
                "typeArguments": []
              }
            }
          },
          {
            "name": "new_admin",
            "type": "Address"
          },
          {
            "name": "start",
            "type": "U64"
          }
        ]
      }
    },
    "exposedFunctions": {
      "destroy": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_acl",
              "name": "BlizzardSuperAdmin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ],
        "return": []
      },
      "destroy_admin": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "BlizzardACL",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_acl",
              "name": "BlizzardAdmin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ],
        "return": []
      },
      "finish_transfer": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_acl",
              "name": "BlizzardSuperAdmin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "is_admin": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "BlizzardACL",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "Address"
        ],
        "return": [
          "Bool"
        ]
      },
      "new": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "Address",
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "new_admin": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "BlizzardACL",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "BlizzardSuperAdmin",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_acl",
              "name": "BlizzardAdmin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "new_and_transfer": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "BlizzardACL",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "BlizzardSuperAdmin",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "Address",
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "revoke": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "BlizzardACL",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "BlizzardSuperAdmin",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "Address"
        ],
        "return": []
      },
      "sign_in": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "BlizzardACL",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "BlizzardAdmin",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_acl",
              "name": "AdminWitness",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "start_transfer": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "BlizzardSuperAdmin",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "Address",
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      }
    }
  },
  "blizzard_allowed_versions": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_allowed_versions",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      }
    ],
    "structs": {
      "AllowedVersions": {
        "abilities": {
          "abilities": [
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "pos0",
            "type": {
              "Vector": "U64"
            }
          }
        ]
      },
      "BlizzardAV": {
        "abilities": {
          "abilities": [
            "Key"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "UID",
                "typeArguments": []
              }
            }
          },
          {
            "name": "allowed_versions",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "vec_set",
                "name": "VecSet",
                "typeArguments": [
                  "U64"
                ]
              }
            }
          }
        ]
      }
    },
    "exposedFunctions": {
      "add": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "BlizzardAV",
                "typeArguments": []
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                      "module": "blizzard",
                      "name": "BLIZZARD",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          "U64"
        ],
        "return": []
      },
      "assert_pkg_version": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "get_allowed_versions": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "BlizzardAV",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_allowed_versions",
              "name": "AllowedVersions",
              "typeArguments": []
            }
          }
        ]
      },
      "remove": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "BlizzardAV",
                "typeArguments": []
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                      "module": "blizzard",
                      "name": "BLIZZARD",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          "U64"
        ],
        "return": []
      }
    }
  },
  "blizzard_big_vector": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_big_vector",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_node"
      }
    ],
    "structs": {
      "BigVector": {
        "abilities": {
          "abilities": [
            "Store",
            "Key"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": [
                "Store"
              ]
            },
            "isPhantom": true
          }
        ],
        "fields": [
          {
            "name": "id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "UID",
                "typeArguments": []
              }
            }
          },
          {
            "name": "slice_idx",
            "type": "U64"
          },
          {
            "name": "slice_size",
            "type": "U32"
          },
          {
            "name": "length",
            "type": "U64"
          }
        ]
      },
      "Slice": {
        "abilities": {
          "abilities": [
            "Drop",
            "Store"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": [
                "Store"
              ]
            },
            "isPhantom": false
          }
        ],
        "fields": [
          {
            "name": "idx",
            "type": "U64"
          },
          {
            "name": "vector",
            "type": {
              "Vector": {
                "TypeParameter": 0
              }
            }
          }
        ]
      }
    },
    "exposedFunctions": {
      "borrow": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64"
        ],
        "return": [
          {
            "Reference": {
              "TypeParameter": 0
            }
          }
        ]
      },
      "borrow_from_slice": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "Slice",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64"
        ],
        "return": [
          {
            "Reference": {
              "TypeParameter": 0
            }
          }
        ]
      },
      "borrow_from_slice_mut": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "Slice",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64"
        ],
        "return": [
          {
            "MutableReference": {
              "TypeParameter": 0
            }
          }
        ]
      },
      "borrow_mut": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64"
        ],
        "return": [
          {
            "MutableReference": {
              "TypeParameter": 0
            }
          }
        ]
      },
      "borrow_slice": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64"
        ],
        "return": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "Slice",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ]
      },
      "borrow_slice_mut": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64"
        ],
        "return": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "Slice",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ]
      },
      "destroy_empty": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_big_vector",
              "name": "BigVector",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ],
        "return": []
      },
      "drop": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Drop",
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_big_vector",
              "name": "BigVector",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ],
        "return": []
      },
      "get_slice_idx": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "Slice",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          "U64"
        ]
      },
      "get_slice_length": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "Slice",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          "U64"
        ]
      },
      "is_empty": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          "Bool"
        ]
      },
      "length": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          "U64"
        ]
      },
      "new": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          "U32",
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_big_vector",
              "name": "BigVector",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "pop_back": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          {
            "TypeParameter": 0
          }
        ]
      },
      "push_back": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "TypeParameter": 0
          }
        ],
        "return": []
      },
      "remove": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64"
        ],
        "return": [
          {
            "TypeParameter": 0
          }
        ]
      },
      "slice_idx": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          "U64"
        ]
      },
      "slice_size": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          "U32"
        ]
      },
      "swap_remove": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64"
        ],
        "return": [
          {
            "TypeParameter": 0
          }
        ]
      }
    }
  },
  "blizzard_constants": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_constants",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_fee"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_node"
      }
    ],
    "structs": {},
    "exposedFunctions": {}
  },
  "blizzard_errors": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_errors",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_acl"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_allowed_versions"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_big_vector"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_fee"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_stake_nft"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_treasury"
      }
    ],
    "structs": {},
    "exposedFunctions": {}
  },
  "blizzard_event_wrapper": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_event_wrapper",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_events"
      }
    ],
    "structs": {
      "BlizzardEvent": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": [
                "Copy",
                "Drop"
              ]
            },
            "isPhantom": false
          }
        ],
        "fields": [
          {
            "name": "pos0",
            "type": {
              "TypeParameter": 0
            }
          }
        ]
      }
    },
    "exposedFunctions": {
      "emit_event": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Copy",
              "Drop"
            ]
          }
        ],
        "parameters": [
          {
            "TypeParameter": 0
          }
        ],
        "return": []
      }
    }
  },
  "blizzard_events": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_events",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_acl"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_node"
      }
    ],
    "structs": {
      "AddNode": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "node_id",
            "type": "Address"
          },
          {
            "name": "lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          }
        ]
      },
      "BurnBlizzardStakeNFT": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "node_id",
            "type": "Address"
          },
          {
            "name": "lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          },
          {
            "name": "activation_epoch",
            "type": "U32"
          },
          {
            "name": "wal_value",
            "type": "U64"
          },
          {
            "name": "lst_value",
            "type": "U64"
          }
        ]
      },
      "BurnLst": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "wal_value",
            "type": "U64"
          },
          {
            "name": "lst_value",
            "type": "U64"
          },
          {
            "name": "fee",
            "type": "U64"
          },
          {
            "name": "protocol_fee",
            "type": "U64"
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          }
        ]
      },
      "FinishSuperAdminTransfer": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "pos0",
            "type": "Address"
          }
        ]
      },
      "Mint": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "wal_value",
            "type": "U64"
          },
          {
            "name": "lst_value",
            "type": "U64"
          },
          {
            "name": "fee",
            "type": "U64"
          },
          {
            "name": "protocol_fee",
            "type": "U64"
          },
          {
            "name": "node_id",
            "type": "Address"
          },
          {
            "name": "lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          }
        ]
      },
      "MintAfterVotesFinished": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "wal_value",
            "type": "U64"
          },
          {
            "name": "fee",
            "type": "U64"
          },
          {
            "name": "protocol_fee",
            "type": "U64"
          },
          {
            "name": "node_id",
            "type": "Address"
          },
          {
            "name": "lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          },
          {
            "name": "activation_epoch",
            "type": "U32"
          }
        ]
      },
      "NewAdmin": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "pos0",
            "type": "Address"
          }
        ]
      },
      "NewFee": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "mint",
            "type": "U64"
          },
          {
            "name": "burn",
            "type": "U64"
          },
          {
            "name": "transmute",
            "type": "U64"
          },
          {
            "name": "protocol",
            "type": "U64"
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          }
        ]
      },
      "NewLST": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "inner_state",
            "type": "Address"
          },
          {
            "name": "state",
            "type": "Address"
          },
          {
            "name": "metadata",
            "type": "Address"
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          }
        ]
      },
      "Pause": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "pos0",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "pos1",
            "type": "U32"
          }
        ]
      },
      "RemoveNode": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "node_id",
            "type": "Address"
          },
          {
            "name": "lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          }
        ]
      },
      "RevokeAdmin": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "pos0",
            "type": "Address"
          }
        ]
      },
      "StakedWalAdded": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "node_id",
            "type": "Address"
          },
          {
            "name": "lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "staked_wal",
            "type": "Address"
          },
          {
            "name": "activation_epoch",
            "type": "U32"
          },
          {
            "name": "value",
            "type": "U64"
          },
          {
            "name": "idx",
            "type": "U64"
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          },
          {
            "name": "joined",
            "type": "Bool"
          }
        ]
      },
      "StakedWalRemoved": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "node_id",
            "type": "Address"
          },
          {
            "name": "lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "staked_wal",
            "type": "Address"
          },
          {
            "name": "activation_epoch",
            "type": "U32"
          },
          {
            "name": "split",
            "type": "Bool"
          },
          {
            "name": "principal",
            "type": "U64"
          },
          {
            "name": "total_wal_value",
            "type": "U64"
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          }
        ]
      },
      "StartSuperAdminTransfer": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "new_admin",
            "type": "Address"
          },
          {
            "name": "start",
            "type": "U64"
          }
        ]
      },
      "SyncExchangeRate": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          },
          {
            "name": "total_wal_value",
            "type": "U64"
          },
          {
            "name": "lst_value",
            "type": "U64"
          }
        ]
      },
      "Transmute": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "from_lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "to_lst",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "from_value",
            "type": "U64"
          },
          {
            "name": "to_value",
            "type": "U64"
          },
          {
            "name": "wal_value",
            "type": "U64"
          },
          {
            "name": "wal_epoch",
            "type": "U32"
          },
          {
            "name": "fee",
            "type": "U64"
          },
          {
            "name": "protocol_fee",
            "type": "U64"
          }
        ]
      },
      "Unpause": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "pos0",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "pos1",
            "type": "U32"
          }
        ]
      }
    },
    "exposedFunctions": {
      "add_node": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "Address",
          "U32"
        ],
        "return": []
      },
      "burn_blizzard_stake_nft": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "Address",
          "U32",
          "U32",
          "U64",
          "U64"
        ],
        "return": []
      },
      "burn_lst": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "U64",
          "U64",
          "U64",
          "U64",
          "U32"
        ],
        "return": []
      },
      "finish_super_admin_transfer": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          "Address"
        ],
        "return": []
      },
      "mint": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "U64",
          "U64",
          "U64",
          "U64",
          "Address",
          "U32"
        ],
        "return": []
      },
      "mint_after_votes_finished": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "U64",
          "U64",
          "U64",
          "Address",
          "U32",
          "U32"
        ],
        "return": []
      },
      "new_admin": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          "Address"
        ],
        "return": []
      },
      "new_fee": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "U64",
          "U64",
          "U64",
          "U64",
          "U32"
        ],
        "return": []
      },
      "new_lst": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "Address",
          "Address",
          "Address",
          "U32"
        ],
        "return": []
      },
      "pause": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "U32"
        ],
        "return": []
      },
      "remove_node": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "Address",
          "U32"
        ],
        "return": []
      },
      "revoke_admin": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          "Address"
        ],
        "return": []
      },
      "staked_wal_added": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "Address",
          "U32",
          "Address",
          "U32",
          "U64",
          "U64",
          "Bool"
        ],
        "return": []
      },
      "staked_wal_removed": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "Address",
          "U32",
          "Address",
          "U32",
          "Bool",
          "U64",
          "U64"
        ],
        "return": []
      },
      "start_super_admin_transfer": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          "Address",
          "U64"
        ],
        "return": []
      },
      "sync_exchange_rate": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "U32",
          "U64",
          "U64"
        ],
        "return": []
      },
      "transmute": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          },
          {
            "abilities": []
          }
        ],
        "parameters": [
          "U64",
          "U64",
          "U64",
          "U32",
          "U64",
          "U64"
        ],
        "return": []
      },
      "unpause": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          "U32"
        ],
        "return": []
      }
    }
  },
  "blizzard_exchange_rate": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_exchange_rate",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_historic_rate"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      }
    ],
    "structs": {
      "ExchangeRate": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop",
            "Store"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "lst",
            "type": "U128"
          },
          {
            "name": "wal",
            "type": "U128"
          }
        ]
      }
    },
    "exposedFunctions": {
      "add_wal_down": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_exchange_rate",
                "name": "ExchangeRate",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": [
          "U64"
        ]
      },
      "empty": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_exchange_rate",
              "name": "ExchangeRate",
              "typeArguments": []
            }
          }
        ]
      },
      "is_empty": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_exchange_rate",
              "name": "ExchangeRate",
              "typeArguments": []
            }
          }
        ],
        "return": [
          "Bool"
        ]
      },
      "lst": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_exchange_rate",
              "name": "ExchangeRate",
              "typeArguments": []
            }
          }
        ],
        "return": [
          "U64"
        ]
      },
      "new": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          "U64",
          "U64"
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_exchange_rate",
              "name": "ExchangeRate",
              "typeArguments": []
            }
          }
        ]
      },
      "sub_lst_down": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_exchange_rate",
                "name": "ExchangeRate",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": [
          "U64"
        ]
      },
      "sub_wal_down": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_exchange_rate",
                "name": "ExchangeRate",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": [
          "U64"
        ]
      },
      "sub_wal_up": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_exchange_rate",
                "name": "ExchangeRate",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": [
          "U64"
        ]
      },
      "to_lst_down": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_exchange_rate",
                "name": "ExchangeRate",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": [
          "U64"
        ]
      },
      "to_lst_up": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_exchange_rate",
                "name": "ExchangeRate",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": [
          "U64"
        ]
      },
      "to_wal_down": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_exchange_rate",
                "name": "ExchangeRate",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": [
          "U64"
        ]
      },
      "to_wal_up": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_exchange_rate",
                "name": "ExchangeRate",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": [
          "U64"
        ]
      },
      "wal": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_exchange_rate",
              "name": "ExchangeRate",
              "typeArguments": []
            }
          }
        ],
        "return": [
          "U64"
        ]
      }
    }
  },
  "blizzard_extended_field": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_extended_field",
    "friends": [],
    "structs": {
      "ExtendedField": {
        "abilities": {
          "abilities": [
            "Store",
            "Key"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": [
                "Store"
              ]
            },
            "isPhantom": true
          }
        ],
        "fields": [
          {
            "name": "id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "UID",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "Key": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop",
            "Store"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "dummy_field",
            "type": "Bool"
          }
        ]
      }
    },
    "exposedFunctions": {
      "borrow": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_extended_field",
                "name": "ExtendedField",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          {
            "Reference": {
              "TypeParameter": 0
            }
          }
        ]
      },
      "borrow_mut": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_extended_field",
                "name": "ExtendedField",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          {
            "MutableReference": {
              "TypeParameter": 0
            }
          }
        ]
      },
      "destroy": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_extended_field",
              "name": "ExtendedField",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ],
        "return": [
          {
            "TypeParameter": 0
          }
        ]
      },
      "new": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "TypeParameter": 0
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_extended_field",
              "name": "ExtendedField",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "swap": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": [
              "Store"
            ]
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_extended_field",
                "name": "ExtendedField",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "TypeParameter": 0
          }
        ],
        "return": [
          {
            "TypeParameter": 0
          }
        ]
      }
    }
  },
  "blizzard_fee": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_fee",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      }
    ],
    "structs": {
      "BlizzardFee": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop",
            "Store"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "mint",
            "type": {
              "Struct": {
                "address": "0x17264709505b1a94908171fa3ec688c472dd59edd8acb38091d1b10cfb85fc43",
                "module": "bps",
                "name": "BPS",
                "typeArguments": []
              }
            }
          },
          {
            "name": "burn",
            "type": {
              "Struct": {
                "address": "0x17264709505b1a94908171fa3ec688c472dd59edd8acb38091d1b10cfb85fc43",
                "module": "bps",
                "name": "BPS",
                "typeArguments": []
              }
            }
          },
          {
            "name": "transmute",
            "type": {
              "Struct": {
                "address": "0x17264709505b1a94908171fa3ec688c472dd59edd8acb38091d1b10cfb85fc43",
                "module": "bps",
                "name": "BPS",
                "typeArguments": []
              }
            }
          },
          {
            "name": "protocol",
            "type": {
              "Struct": {
                "address": "0x17264709505b1a94908171fa3ec688c472dd59edd8acb38091d1b10cfb85fc43",
                "module": "bps",
                "name": "BPS",
                "typeArguments": []
              }
            }
          }
        ]
      }
    },
    "exposedFunctions": {
      "burn": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_fee",
                "name": "BlizzardFee",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x17264709505b1a94908171fa3ec688c472dd59edd8acb38091d1b10cfb85fc43",
              "module": "bps",
              "name": "BPS",
              "typeArguments": []
            }
          }
        ]
      },
      "mint": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_fee",
                "name": "BlizzardFee",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x17264709505b1a94908171fa3ec688c472dd59edd8acb38091d1b10cfb85fc43",
              "module": "bps",
              "name": "BPS",
              "typeArguments": []
            }
          }
        ]
      },
      "new": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_fee",
              "name": "BlizzardFee",
              "typeArguments": []
            }
          }
        ]
      },
      "protocol": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_fee",
                "name": "BlizzardFee",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x17264709505b1a94908171fa3ec688c472dd59edd8acb38091d1b10cfb85fc43",
              "module": "bps",
              "name": "BPS",
              "typeArguments": []
            }
          }
        ]
      },
      "set_burn": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_fee",
                "name": "BlizzardFee",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": []
      },
      "set_mint": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_fee",
                "name": "BlizzardFee",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": []
      },
      "set_protocol": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_fee",
                "name": "BlizzardFee",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": []
      },
      "set_transmute": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_fee",
                "name": "BlizzardFee",
                "typeArguments": []
              }
            }
          },
          "U64"
        ],
        "return": []
      },
      "transmute": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_fee",
                "name": "BlizzardFee",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x17264709505b1a94908171fa3ec688c472dd59edd8acb38091d1b10cfb85fc43",
              "module": "bps",
              "name": "BPS",
              "typeArguments": []
            }
          }
        ]
      }
    }
  },
  "blizzard_historic_rate": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_historic_rate",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      }
    ],
    "structs": {
      "HistoricRate": {
        "abilities": {
          "abilities": [
            "Store",
            "Key"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "UID",
                "typeArguments": []
              }
            }
          },
          {
            "name": "exchange_rate",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "table",
                "name": "Table",
                "typeArguments": [
                  "U32",
                  {
                    "Struct": {
                      "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                      "module": "blizzard_exchange_rate",
                      "name": "ExchangeRate",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          {
            "name": "initial_epoch",
            "type": "U32"
          }
        ]
      }
    },
    "exposedFunctions": {
      "add_epoch": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_historic_rate",
                "name": "HistoricRate",
                "typeArguments": []
              }
            }
          },
          "U32",
          "U64",
          "U64"
        ],
        "return": []
      },
      "borrow": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_historic_rate",
                "name": "HistoricRate",
                "typeArguments": []
              }
            }
          },
          "U32"
        ],
        "return": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_exchange_rate",
                "name": "ExchangeRate",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "borrow_mut": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_historic_rate",
                "name": "HistoricRate",
                "typeArguments": []
              }
            }
          },
          "U32"
        ],
        "return": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_exchange_rate",
                "name": "ExchangeRate",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "contains": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_historic_rate",
                "name": "HistoricRate",
                "typeArguments": []
              }
            }
          },
          "U32"
        ],
        "return": [
          "Bool"
        ]
      },
      "new": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          "U32",
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_historic_rate",
              "name": "HistoricRate",
              "typeArguments": []
            }
          }
        ]
      },
      "rate_at_epoch": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_historic_rate",
                "name": "HistoricRate",
                "typeArguments": []
              }
            }
          },
          "U32"
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_exchange_rate",
              "name": "ExchangeRate",
              "typeArguments": []
            }
          }
        ]
      }
    }
  },
  "blizzard_inner_protocol": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_inner_protocol",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_protocol"
      }
    ],
    "structs": {
      "BlizzardStateV1": {
        "abilities": {
          "abilities": [
            "Store",
            "Key"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": []
            },
            "isPhantom": true
          }
        ],
        "fields": [
          {
            "name": "id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "UID",
                "typeArguments": []
              }
            }
          },
          {
            "name": "paused",
            "type": "Bool"
          },
          {
            "name": "wal_fees",
            "type": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "FeeBalances",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59",
                      "module": "wal",
                      "name": "WAL",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          {
            "name": "lst_fees",
            "type": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "FeeBalances",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "name": "historic_rate",
            "type": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_historic_rate",
                "name": "HistoricRate",
                "typeArguments": []
              }
            }
          },
          {
            "name": "treasury",
            "type": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_treasury",
                "name": "BlizzardTreasury",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "name": "total_wal_value",
            "type": "U64"
          },
          {
            "name": "allowed_nodes",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "vec_set",
                "name": "VecSet",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0x2",
                      "module": "object",
                      "name": "ID",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          {
            "name": "nodes",
            "type": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_extended_field",
                "name": "ExtendedField",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0x2",
                      "module": "vec_map",
                      "name": "VecMap",
                      "typeArguments": [
                        {
                          "Struct": {
                            "address": "0x2",
                            "module": "object",
                            "name": "ID",
                            "typeArguments": []
                          }
                        },
                        {
                          "Struct": {
                            "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                            "module": "blizzard_node",
                            "name": "BlizzardNode",
                            "typeArguments": []
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          },
          {
            "name": "last_synced_epoch",
            "type": "U32"
          },
          {
            "name": "metadata",
            "type": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_extended_field",
                "name": "ExtendedField",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                      "module": "blizzard_metadata",
                      "name": "BlizzardMetadata",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          {
            "name": "fee_config",
            "type": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_fee",
                "name": "BlizzardFee",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "FeeBalances": {
        "abilities": {
          "abilities": [
            "Store"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": []
            },
            "isPhantom": true
          }
        ],
        "fields": [
          {
            "name": "fee",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "balance",
                "name": "Balance",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "name": "protocol",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "balance",
                "name": "Balance",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ]
      }
    },
    "exposedFunctions": {
      "add_node": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "allowed_nodes": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          {
            "Vector": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "ID",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "burn_lst": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          {
            "Vector": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_withdraw_ix",
                "name": "IX",
                "typeArguments": []
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          {
            "Vector": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staked_wal",
                "name": "StakedWal",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "burn_stake_nft": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_stake_nft",
              "name": "BlizzardStakeNFT",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "claim_fees": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "Struct": {
                    "address": "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59",
                    "module": "wal",
                    "name": "WAL",
                    "typeArguments": []
                  }
                }
              ]
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "claim_protocol_fees": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "Struct": {
                    "address": "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59",
                    "module": "wal",
                    "name": "WAL",
                    "typeArguments": []
                  }
                }
              ]
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "fee_config": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_fee",
                "name": "BlizzardFee",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "mint": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "Struct": {
                    "address": "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59",
                    "module": "wal",
                    "name": "WAL",
                    "typeArguments": []
                  }
                }
              ]
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "mint_after_votes_finished": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "Struct": {
                    "address": "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59",
                    "module": "wal",
                    "name": "WAL",
                    "typeArguments": []
                  }
                }
              ]
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_stake_nft",
              "name": "BlizzardStakeNFT",
              "typeArguments": []
            }
          }
        ]
      },
      "new_state_v1": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          "Address",
          {
            "Reference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "CoinMetadata",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "TreasuryCap",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          "Address",
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_inner_protocol",
              "name": "BlizzardStateV1",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "pause": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "remove_node": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "set_burn_fee": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64",
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "set_mint_fee": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64",
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "set_protocol_fee": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64",
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "set_transmute_fee": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64",
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "staked_wal_vector_at_node": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "ID",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                      "module": "staked_wal",
                      "name": "StakedWal",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "sync_exchange_rate": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "sync_node_exchange_rate": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          }
        ],
        "return": []
      },
      "to_lst_at_epoch": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U32",
          "U64",
          "Bool"
        ],
        "return": [
          {
            "Struct": {
              "address": "0x1",
              "module": "option",
              "name": "Option",
              "typeArguments": [
                "U64"
              ]
            }
          }
        ]
      },
      "to_wal_at_epoch": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U32",
          "U64",
          "Bool"
        ],
        "return": [
          {
            "Struct": {
              "address": "0x1",
              "module": "option",
              "name": "Option",
              "typeArguments": [
                "U64"
              ]
            }
          }
        ]
      },
      "transmute": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0xb1b0650a8862e30e3f604fd6c5838bc25464b8d3d827fbd58af7cb9685b832bf",
                      "module": "wwal",
                      "name": "WWAL",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          {
            "Vector": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_withdraw_ix",
                "name": "IX",
                "typeArguments": []
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "Struct": {
                    "address": "0xb1b0650a8862e30e3f604fd6c5838bc25464b8d3d827fbd58af7cb9685b832bf",
                    "module": "wwal",
                    "name": "WWAL",
                    "typeArguments": []
                  }
                }
              ]
            }
          }
        ]
      },
      "unpause": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "update_description": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "CoinMetadata",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x1",
              "module": "string",
              "name": "String",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "update_icon_url": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "CoinMetadata",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x1",
              "module": "ascii",
              "name": "String",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "update_name": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "CoinMetadata",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x1",
              "module": "string",
              "name": "String",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "update_symbol": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_inner_protocol",
                "name": "BlizzardStateV1",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "CoinMetadata",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x1",
              "module": "ascii",
              "name": "String",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      }
    }
  },
  "blizzard_metadata": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_metadata",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_stake_nft"
      }
    ],
    "structs": {
      "BlizzardMetadata": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop",
            "Store"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "name",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "string",
                "name": "String",
                "typeArguments": []
              }
            }
          },
          {
            "name": "symbol",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "ascii",
                "name": "String",
                "typeArguments": []
              }
            }
          },
          {
            "name": "description",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "string",
                "name": "String",
                "typeArguments": []
              }
            }
          },
          {
            "name": "icon_url",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "option",
                "name": "Option",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0x2",
                      "module": "url",
                      "name": "Url",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          {
            "name": "decimals",
            "type": "U8"
          }
        ]
      }
    },
    "exposedFunctions": {
      "decimals": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_metadata",
                "name": "BlizzardMetadata",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          "U8"
        ]
      },
      "description": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_metadata",
                "name": "BlizzardMetadata",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x1",
              "module": "string",
              "name": "String",
              "typeArguments": []
            }
          }
        ]
      },
      "icon_url": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_metadata",
                "name": "BlizzardMetadata",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x1",
              "module": "option",
              "name": "Option",
              "typeArguments": [
                {
                  "Struct": {
                    "address": "0x2",
                    "module": "url",
                    "name": "Url",
                    "typeArguments": []
                  }
                }
              ]
            }
          }
        ]
      },
      "name": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_metadata",
                "name": "BlizzardMetadata",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x1",
              "module": "string",
              "name": "String",
              "typeArguments": []
            }
          }
        ]
      },
      "new": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "CoinMetadata",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_metadata",
              "name": "BlizzardMetadata",
              "typeArguments": []
            }
          }
        ]
      },
      "symbol": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_metadata",
                "name": "BlizzardMetadata",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x1",
              "module": "ascii",
              "name": "String",
              "typeArguments": []
            }
          }
        ]
      }
    }
  },
  "blizzard_node": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_node",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      }
    ],
    "structs": {
      "BlizzardNode": {
        "abilities": {
          "abilities": [
            "Store"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "node_id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "ID",
                "typeArguments": []
              }
            }
          },
          {
            "name": "staked_wal_vector",
            "type": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                      "module": "staked_wal",
                      "name": "StakedWal",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          {
            "name": "epoch_table",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "table",
                "name": "Table",
                "typeArguments": [
                  "U32",
                  "U64"
                ]
              }
            }
          },
          {
            "name": "last_synced_epoch",
            "type": "U32"
          },
          {
            "name": "last_synced_wal_value",
            "type": "U64"
          }
        ]
      }
    },
    "exposedFunctions": {
      "add_staked_wal": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_node",
                "name": "BlizzardNode",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
              "module": "staked_wal",
              "name": "StakedWal",
              "typeArguments": []
            }
          },
          "U32"
        ],
        "return": []
      },
      "epoch_table": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_node",
                "name": "BlizzardNode",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Reference": {
              "Struct": {
                "address": "0x2",
                "module": "table",
                "name": "Table",
                "typeArguments": [
                  "U32",
                  "U64"
                ]
              }
            }
          }
        ]
      },
      "new": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_node",
              "name": "BlizzardNode",
              "typeArguments": []
            }
          }
        ]
      },
      "remove_staked_wals": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_node",
                "name": "BlizzardNode",
                "typeArguments": []
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Vector": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_withdraw_ix",
                "name": "EpochValue",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          "U64",
          {
            "Vector": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staked_wal",
                "name": "StakedWal",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "staked_wal_vector": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_node",
                "name": "BlizzardNode",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                      "module": "staked_wal",
                      "name": "StakedWal",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "sync": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_node",
                "name": "BlizzardNode",
                "typeArguments": []
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          "U32"
        ],
        "return": [
          "U64"
        ]
      }
    }
  },
  "blizzard_protocol": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_protocol",
    "friends": [],
    "structs": {
      "BlizzardStaking": {
        "abilities": {
          "abilities": [
            "Key"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": []
            },
            "isPhantom": true
          }
        ],
        "fields": [
          {
            "name": "id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "UID",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "Key": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop",
            "Store"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "dummy_field",
            "type": "Bool"
          }
        ]
      }
    },
    "exposedFunctions": {
      "add_node": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "allowed_nodes": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          {
            "Vector": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "ID",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "burn_lst": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          {
            "Vector": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_withdraw_ix",
                "name": "IX",
                "typeArguments": []
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          {
            "Vector": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staked_wal",
                "name": "StakedWal",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "burn_stake_nft": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_stake_nft",
              "name": "BlizzardStakeNFT",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "claim_fees": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "Struct": {
                    "address": "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59",
                    "module": "wal",
                    "name": "WAL",
                    "typeArguments": []
                  }
                }
              ]
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "claim_protocol_fees": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                      "module": "blizzard",
                      "name": "BLIZZARD",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "Struct": {
                    "address": "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59",
                    "module": "wal",
                    "name": "WAL",
                    "typeArguments": []
                  }
                }
              ]
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "fee_config": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_fee",
                "name": "BlizzardFee",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "forceful_pause": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                      "module": "blizzard",
                      "name": "BLIZZARD",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "mint": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "Struct": {
                    "address": "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59",
                    "module": "wal",
                    "name": "WAL",
                    "typeArguments": []
                  }
                }
              ]
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      },
      "mint_after_votes_finished": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "Struct": {
                    "address": "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59",
                    "module": "wal",
                    "name": "WAL",
                    "typeArguments": []
                  }
                }
              ]
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_stake_nft",
              "name": "BlizzardStakeNFT",
              "typeArguments": []
            }
          }
        ]
      },
      "new": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "CoinMetadata",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                      "module": "blizzard",
                      "name": "BLIZZARD",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "TreasuryCap",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          "Address",
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "pause": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "remove_node": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "set_burn_fee": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64",
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "set_mint_fee": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64",
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "set_protocol_fee": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                      "module": "blizzard",
                      "name": "BLIZZARD",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          "U64",
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "set_transmute_fee": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U64",
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "staked_wal_vector_at_node": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "ID",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_big_vector",
                "name": "BigVector",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                      "module": "staked_wal",
                      "name": "StakedWal",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "sync_exchange_rate": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "sync_node_exchange_rate": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          }
        ],
        "return": []
      },
      "to_lst_at_epoch": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U32",
          "U64",
          "Bool"
        ],
        "return": [
          {
            "Struct": {
              "address": "0x1",
              "module": "option",
              "name": "Option",
              "typeArguments": [
                "U64"
              ]
            }
          }
        ]
      },
      "to_wal_at_epoch": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          "U32",
          "U64",
          "Bool"
        ],
        "return": [
          {
            "Struct": {
              "address": "0x1",
              "module": "option",
              "name": "Option",
              "typeArguments": [
                "U64"
              ]
            }
          }
        ]
      },
      "transmute": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "Struct": {
                      "address": "0xb1b0650a8862e30e3f604fd6c5838bc25464b8d3d827fbd58af7cb9685b832bf",
                      "module": "wwal",
                      "name": "WWAL",
                      "typeArguments": []
                    }
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staking",
                "name": "Staking",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          {
            "Vector": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_withdraw_ix",
                "name": "IX",
                "typeArguments": []
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "Coin",
              "typeArguments": [
                {
                  "Struct": {
                    "address": "0xb1b0650a8862e30e3f604fd6c5838bc25464b8d3d827fbd58af7cb9685b832bf",
                    "module": "wwal",
                    "name": "WWAL",
                    "typeArguments": []
                  }
                }
              ]
            }
          }
        ]
      },
      "unpause": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "update_description": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "CoinMetadata",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x1",
              "module": "string",
              "name": "String",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "update_icon_url": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "CoinMetadata",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x1",
              "module": "ascii",
              "name": "String",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "update_name": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "CoinMetadata",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x1",
              "module": "string",
              "name": "String",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "update_symbol": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_protocol",
                "name": "BlizzardStaking",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "CoinMetadata",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_acl",
                "name": "AdminWitness",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          },
          {
            "Struct": {
              "address": "0x1",
              "module": "ascii",
              "name": "String",
              "typeArguments": []
            }
          },
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_allowed_versions",
                "name": "AllowedVersions",
                "typeArguments": []
              }
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      }
    }
  },
  "blizzard_stake_nft": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_stake_nft",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      }
    ],
    "structs": {
      "BLIZZARD_STAKE_NFT": {
        "abilities": {
          "abilities": [
            "Drop"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "dummy_field",
            "type": "Bool"
          }
        ]
      },
      "BlizzardStakeNFT": {
        "abilities": {
          "abilities": [
            "Key"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "UID",
                "typeArguments": []
              }
            }
          },
          {
            "name": "inner",
            "type": {
              "Struct": {
                "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
                "module": "staked_wal",
                "name": "StakedWal",
                "typeArguments": []
              }
            }
          },
          {
            "name": "symbol",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "ascii",
                "name": "String",
                "typeArguments": []
              }
            }
          },
          {
            "name": "type_name",
            "type": {
              "Struct": {
                "address": "0x1",
                "module": "type_name",
                "name": "TypeName",
                "typeArguments": []
              }
            }
          },
          {
            "name": "activation_epoch",
            "type": "U32"
          },
          {
            "name": "value",
            "type": "U64"
          }
        ]
      }
    },
    "exposedFunctions": {
      "assert_type": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_stake_nft",
                "name": "BlizzardStakeNFT",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "destroy": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_stake_nft",
              "name": "BlizzardStakeNFT",
              "typeArguments": []
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
              "module": "staked_wal",
              "name": "StakedWal",
              "typeArguments": []
            }
          }
        ]
      },
      "join": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_stake_nft",
                "name": "BlizzardStakeNFT",
                "typeArguments": []
              }
            }
          },
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_stake_nft",
              "name": "BlizzardStakeNFT",
              "typeArguments": []
            }
          }
        ],
        "return": []
      },
      "keep": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_stake_nft",
              "name": "BlizzardStakeNFT",
              "typeArguments": []
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      },
      "new": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Struct": {
              "address": "0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77",
              "module": "staked_wal",
              "name": "StakedWal",
              "typeArguments": []
            }
          },
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_metadata",
              "name": "BlizzardMetadata",
              "typeArguments": []
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_stake_nft",
              "name": "BlizzardStakeNFT",
              "typeArguments": []
            }
          }
        ]
      },
      "split": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_stake_nft",
                "name": "BlizzardStakeNFT",
                "typeArguments": []
              }
            }
          },
          "U64",
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_stake_nft",
              "name": "BlizzardStakeNFT",
              "typeArguments": []
            }
          }
        ]
      },
      "split_and_keep": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_stake_nft",
                "name": "BlizzardStakeNFT",
                "typeArguments": []
              }
            }
          },
          "U64",
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": []
      }
    }
  },
  "blizzard_treasury": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_treasury",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      }
    ],
    "structs": {
      "BlizzardTreasury": {
        "abilities": {
          "abilities": [
            "Store",
            "Key"
          ]
        },
        "typeParameters": [
          {
            "constraints": {
              "abilities": []
            },
            "isPhantom": true
          }
        ],
        "fields": [
          {
            "name": "id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "UID",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "Key": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop",
            "Store"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "dummy_field",
            "type": "Bool"
          }
        ]
      }
    },
    "exposedFunctions": {
      "inner": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Reference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_treasury",
                "name": "BlizzardTreasury",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          {
            "Reference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "TreasuryCap",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ]
      },
      "inner_mut": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_treasury",
                "name": "BlizzardTreasury",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ],
        "return": [
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "coin",
                "name": "TreasuryCap",
                "typeArguments": [
                  {
                    "TypeParameter": 0
                  }
                ]
              }
            }
          }
        ]
      },
      "new": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [
          {
            "abilities": []
          }
        ],
        "parameters": [
          {
            "Struct": {
              "address": "0x2",
              "module": "coin",
              "name": "TreasuryCap",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          },
          {
            "MutableReference": {
              "Struct": {
                "address": "0x2",
                "module": "tx_context",
                "name": "TxContext",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_treasury",
              "name": "BlizzardTreasury",
              "typeArguments": [
                {
                  "TypeParameter": 0
                }
              ]
            }
          }
        ]
      }
    }
  },
  "blizzard_withdraw_ix": {
    "fileFormatVersion": 6,
    "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
    "name": "blizzard_withdraw_ix",
    "friends": [
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_inner_protocol"
      },
      {
        "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
        "name": "blizzard_node"
      }
    ],
    "structs": {
      "EpochValue": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop",
            "Store"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "epoch",
            "type": "U32"
          },
          {
            "name": "value",
            "type": "U64"
          }
        ]
      },
      "IX": {
        "abilities": {
          "abilities": [
            "Copy",
            "Drop",
            "Store"
          ]
        },
        "typeParameters": [],
        "fields": [
          {
            "name": "node_id",
            "type": {
              "Struct": {
                "address": "0x2",
                "module": "object",
                "name": "ID",
                "typeArguments": []
              }
            }
          },
          {
            "name": "epoch_values",
            "type": {
              "Vector": {
                "Struct": {
                  "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                  "module": "blizzard_withdraw_ix",
                  "name": "EpochValue",
                  "typeArguments": []
                }
              }
            }
          }
        ]
      }
    },
    "exposedFunctions": {
      "epoch": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_withdraw_ix",
              "name": "EpochValue",
              "typeArguments": []
            }
          }
        ],
        "return": [
          "U32"
        ]
      },
      "epoch_values": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_withdraw_ix",
              "name": "IX",
              "typeArguments": []
            }
          }
        ],
        "return": [
          {
            "Vector": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_withdraw_ix",
                "name": "EpochValue",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "new_epoch_value_vector": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Vector": "U32"
          },
          {
            "Vector": "U64"
          }
        ],
        "return": [
          {
            "Vector": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_withdraw_ix",
                "name": "EpochValue",
                "typeArguments": []
              }
            }
          }
        ]
      },
      "new_ix": {
        "visibility": "Public",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          },
          {
            "Vector": {
              "Struct": {
                "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
                "module": "blizzard_withdraw_ix",
                "name": "EpochValue",
                "typeArguments": []
              }
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_withdraw_ix",
              "name": "IX",
              "typeArguments": []
            }
          }
        ]
      },
      "node_id": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_withdraw_ix",
              "name": "IX",
              "typeArguments": []
            }
          }
        ],
        "return": [
          {
            "Struct": {
              "address": "0x2",
              "module": "object",
              "name": "ID",
              "typeArguments": []
            }
          }
        ]
      },
      "value": {
        "visibility": "Friend",
        "isEntry": false,
        "typeParameters": [],
        "parameters": [
          {
            "Struct": {
              "address": "0x29ba7f7bc53e776f27a6d1289555ded2f407b4b1a799224f06b26addbcd1c33d",
              "module": "blizzard_withdraw_ix",
              "name": "EpochValue",
              "typeArguments": []
            }
          }
        ],
        "return": [
          "U64"
        ]
      }
    }
  }
}
const interfacesCode = generateEventInterfaces(jsonData);
console.log(interfacesCode);